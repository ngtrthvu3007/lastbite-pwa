import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { DB, Database } from '../db/database.module';
import { mediaAssets, posts, stores } from '../db/schema';
import { MediaService } from '../media/media.service';
import { CreatePostInput, PostDto, PostStatus } from './dto/post.dto';

const ACTIVE_POST_LIMIT = 20;

const POST_COLUMNS = {
  id: posts.id,
  title: posts.title,
  description: posts.description,
  originalPrice: posts.originalPrice,
  currentPrice: posts.currentPrice,
  remainingQuantity: posts.remainingQuantity,
  pickupStartAt: posts.pickupStartAt,
  pickupEndAt: posts.pickupEndAt,
  expiresAt: posts.expiresAt,
  storeName: posts.storeNameSnapshot,
  phone: posts.phoneSnapshot,
  address: posts.addressSnapshot,
  createdAt: posts.createdAt,
  closedAt: posts.closedAt,
};

const POST_WITH_IMAGE_COLUMNS = { ...POST_COLUMNS, objectKey: mediaAssets.objectKey };

type PostRecord = Omit<PostDto, 'imageUrl' | 'status'> & {
  closedAt: Date | null;
};

type PostWithImage = PostRecord & {
  objectKey: string;
};

type PostWithOwner = Pick<PostRecord, 'id' | 'closedAt' | 'expiresAt'> & {
  ownerId: string;
};

@Injectable()
export class PostService {
  private makePostError(message: string, code: string): GraphQLError {
    return new GraphQLError(message, { extensions: { code } });
  }

  private getPostStatus(post: Pick<PostRecord, 'closedAt' | 'expiresAt'>): PostStatus {
    if (post.closedAt) {
      return PostStatus.CLOSED;
    }

    return post.expiresAt <= new Date() ? PostStatus.EXPIRED : PostStatus.ACTIVE;
  }

  private validateCanClose(status: PostStatus): void {
    switch (status) {
      case PostStatus.ACTIVE:
        return;
      case PostStatus.CLOSED:
      case PostStatus.EXPIRED:
        throw this.makePostError('Post is no longer active', 'POST_NOT_ACTIVE');
    }
  }

  private validateInput(input: CreatePostInput): void {
    if (input.originalPrice !== undefined && input.originalPrice < input.currentPrice) {
      throw this.makePostError(
        'Original price cannot be lower than current price',
        'ORIGINAL_PRICE_INVALID',
      );
    }

    if (input.pickupStartAt >= input.pickupEndAt || input.expiresAt > input.pickupEndAt) {
      throw this.makePostError('Pickup window or expiry time is invalid', 'PICKUP_WINDOW_INVALID');
    }

    if (input.expiresAt <= new Date()) {
      throw this.makePostError('Expiry time must be in the future', 'EXPIRY_INVALID');
    }
  }

  private async findPostWithImageRepo(postId: string): Promise<PostWithImage | null> {
    const [post] = await this.db
      .select(POST_WITH_IMAGE_COLUMNS)
      .from(posts)
      .innerJoin(mediaAssets, eq(posts.imageAssetId, mediaAssets.id))
      .where(eq(posts.id, postId))
      .limit(1);

    return post ?? null;
  }

  private async findPostWithOwnerRepo(postId: string): Promise<PostWithOwner | null> {
    const [post] = await this.db
      .select({
        id: posts.id,
        closedAt: posts.closedAt,
        expiresAt: posts.expiresAt,
        ownerId: stores.ownerId,
      })
      .from(posts)
      .innerJoin(stores, eq(posts.storeId, stores.id))
      .where(eq(posts.id, postId))
      .limit(1);

    return post ?? null;
  }

  private async toPostDto(post: PostWithImage): Promise<PostDto> {
    const { closedAt, objectKey, ...dto } = post;

    return {
      ...dto,
      status: this.getPostStatus({ closedAt, expiresAt: dto.expiresAt }),
      imageUrl: await this.mediaService.getPostImageUrlService(objectKey),
    };
  }

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly mediaService: MediaService,
  ) {}

  async createPostService(ownerUserId: string, input: CreatePostInput): Promise<PostDto> {
    this.validateInput(input);

    const [store] = await this.db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, ownerUserId))
      .limit(1);

    if (!store) {
      throw this.makePostError('A store is required to create a post', 'STORE_REQUIRED');
    }

    const asset = await this.mediaService.findUploadedPostImageAssetService(
      ownerUserId,
      input.imageAssetId,
    );

    const [post] = await this.db
      .insert(posts)
      .values({
        storeId: store.id,
        imageAssetId: input.imageAssetId,
        title: input.title,
        description: input.description ?? null,
        originalPrice: input.originalPrice ?? null,
        currentPrice: input.currentPrice,
        initialQuantity: input.quantity,
        remainingQuantity: input.quantity,
        pickupStartAt: input.pickupStartAt,
        pickupEndAt: input.pickupEndAt,
        expiresAt: input.expiresAt,
        storeNameSnapshot: input.storeName,
        phoneSnapshot: input.phone,
        addressSnapshot: input.address,
      })
      .returning(POST_COLUMNS);

    return this.toPostDto({ ...post, objectKey: asset.objectKey });
  }

  async closePostService(ownerUserId: string, postId: string): Promise<PostDto> {
    const post = await this.findPostWithOwnerRepo(postId);

    if (!post) {
      throw this.makePostError('Post was not found', 'POST_NOT_FOUND');
    }

    if (post.ownerId !== ownerUserId) {
      throw this.makePostError('You do not own this post', 'POST_FORBIDDEN');
    }

    this.validateCanClose(this.getPostStatus(post));

    const now = new Date();
    const [closedPost] = await this.db
      .update(posts)
      .set({ closedAt: now })
      .where(and(eq(posts.id, postId), isNull(posts.closedAt), gt(posts.expiresAt, now)))
      .returning({ id: posts.id });

    if (!closedPost) {
      throw this.makePostError('Post is no longer active', 'POST_NOT_ACTIVE');
    }

    const postWithImage = await this.findPostWithImageRepo(closedPost.id);

    if (!postWithImage) {
      throw this.makePostError('Post was not found', 'POST_NOT_FOUND');
    }

    return this.toPostDto(postWithImage);
  }

  async findActivePostsService(limit: number): Promise<PostDto[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > ACTIVE_POST_LIMIT) {
      throw this.makePostError(
        `Limit must be between 1 and ${ACTIVE_POST_LIMIT}`,
        'POST_LIMIT_INVALID',
      );
    }

    const postsWithImage = await this.db
      .select(POST_WITH_IMAGE_COLUMNS)
      .from(posts)
      .innerJoin(mediaAssets, eq(posts.imageAssetId, mediaAssets.id))
      .where(
        and(
          gt(posts.remainingQuantity, 0),
          gt(posts.expiresAt, new Date()),
          isNull(posts.closedAt),
        ),
      )
      .orderBy(asc(posts.expiresAt))
      .limit(limit);

    return Promise.all(postsWithImage.map((post) => this.toPostDto(post)));
  }

  async findPublicPostService(id: string): Promise<PostDto | null> {
    const post = await this.findPostWithImageRepo(id);

    if (!post) {
      return null;
    }

    switch (this.getPostStatus(post)) {
      case PostStatus.CLOSED:
        return this.toPostDto(post);
      case PostStatus.ACTIVE:
        return post.remainingQuantity > 0 ? this.toPostDto(post) : null;
      case PostStatus.EXPIRED:
        return null;
    }

    return null;
  }
}
