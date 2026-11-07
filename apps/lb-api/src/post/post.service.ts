import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { DB, Database } from '../db/database.module';
import { mediaAssets, posts, stores } from '../db/schema';
import { MediaService } from '../media/media.service';
import { CreatePostInput, PostDto } from './dto/post.dto';

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
};

const POST_WITH_IMAGE_COLUMNS = { ...POST_COLUMNS, objectKey: mediaAssets.objectKey };
const ACTIVE_POST_LIMIT = 20;

@Injectable()
export class PostService {
  private validateInput(input: CreatePostInput): void {
    if (input.originalPrice !== undefined && input.originalPrice < input.currentPrice) {
      throw new GraphQLError('Original price cannot be lower than current price', {
        extensions: { code: 'ORIGINAL_PRICE_INVALID' },
      });
    }

    if (input.pickupStartAt >= input.pickupEndAt || input.expiresAt > input.pickupEndAt) {
      throw new GraphQLError('Pickup window or expiry time is invalid', {
        extensions: { code: 'PICKUP_WINDOW_INVALID' },
      });
    }

    if (input.expiresAt <= new Date()) {
      throw new GraphQLError('Expiry time must be in the future', {
        extensions: { code: 'EXPIRY_INVALID' },
      });
    }
  }

  private async toPostDto(post: Omit<PostDto, 'imageUrl'>, objectKey: string): Promise<PostDto> {
    return { ...post, imageUrl: await this.mediaService.getPostImageUrlService(objectKey) };
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
      throw new GraphQLError('A store is required to create a post', {
        extensions: { code: 'STORE_REQUIRED' },
      });
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

    return { ...post, imageUrl: await this.mediaService.getPostImageUrlService(asset.objectKey) };
  }

  async findActivePostsService(limit: number): Promise<PostDto[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > ACTIVE_POST_LIMIT) {
      throw new GraphQLError(`Limit must be between 1 and ${ACTIVE_POST_LIMIT}`, {
        extensions: { code: 'POST_LIMIT_INVALID' },
      });
    }

    const rows = await this.db
      .select(POST_WITH_IMAGE_COLUMNS)
      .from(posts)
      .innerJoin(mediaAssets, eq(posts.imageAssetId, mediaAssets.id))
      .where(and(gt(posts.remainingQuantity, 0), gt(posts.expiresAt, new Date())))
      .orderBy(asc(posts.expiresAt))
      .limit(limit);

    return Promise.all(rows.map(({ objectKey, ...post }) => this.toPostDto(post, objectKey)));
  }

  async findActivePostService(id: string): Promise<PostDto | null> {
    const [row] = await this.db
      .select(POST_WITH_IMAGE_COLUMNS)
      .from(posts)
      .innerJoin(mediaAssets, eq(posts.imageAssetId, mediaAssets.id))
      .where(and(eq(posts.id, id), gt(posts.remainingQuantity, 0), gt(posts.expiresAt, new Date())))
      .limit(1);

    if (!row) return null;

    const { objectKey, ...post } = row;

    return this.toPostDto(post, objectKey);
  }
}
