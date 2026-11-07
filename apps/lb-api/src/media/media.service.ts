import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { DB, Database } from '../db/database.module';
import { mediaAssets } from '../db/schema';
import { MEDIA_CONFIG, MediaConfig } from './media.config';
import { CreatePostImageUploadInput, PostImageAssetDto, PostImageUploadDto } from './dto/media.dto';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly s3: S3Client;

  private makeObjectKey(
    ownerUserId: string,
    contentType: CreatePostImageUploadInput['contentType'],
  ): string {
    const extension = contentType.split('/')[1];

    return `uploads/${ownerUserId}/${randomUUID()}.${extension}`;
  }

  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(MEDIA_CONFIG) private readonly config: MediaConfig,
  ) {
    this.s3 = new S3Client({ region: config.region });
  }

  async createPostImageUploadService(
    ownerUserId: string,
    input: CreatePostImageUploadInput,
  ): Promise<PostImageUploadDto> {
    const objectKey = this.makeObjectKey(ownerUserId, input.contentType);
    const [asset] = await this.db
      .insert(mediaAssets)
      .values({ ownerUserId, objectKey, contentType: input.contentType })
      .returning({ id: mediaAssets.id });
    const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000);
    const upload = await createPresignedPost(this.s3, {
      Bucket: this.config.bucket,
      Key: objectKey,
      Fields: { 'Content-Type': input.contentType },
      Conditions: [
        ['content-length-range', 1, MAX_POST_IMAGE_BYTES],
        ['eq', '$Content-Type', input.contentType],
      ],
      Expires: UPLOAD_URL_TTL_SECONDS,
    });

    return {
      assetId: asset.id,
      uploadUrl: upload.url,
      fields: Object.entries(upload.fields).map(([name, value]) => ({ name, value })),
      expiresAt,
    };
  }

  async completePostImageUploadService(
    ownerUserId: string,
    assetId: string,
  ): Promise<PostImageAssetDto> {
    const [asset] = await this.db
      .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, assetId), eq(mediaAssets.ownerUserId, ownerUserId)))
      .limit(1);

    if (!asset) {
      throw new GraphQLError('Post image was not found', {
        extensions: { code: 'POST_IMAGE_NOT_FOUND' },
      });
    }

    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: asset.objectKey }),
      );
    } catch {
      throw new GraphQLError('Post image has not been uploaded', {
        extensions: { code: 'POST_IMAGE_NOT_UPLOADED' },
      });
    }

    await this.db
      .update(mediaAssets)
      .set({ uploadedAt: new Date() })
      .where(eq(mediaAssets.id, asset.id));

    return { id: asset.id };
  }

  async findUploadedPostImageAssetService(
    ownerUserId: string,
    assetId: string,
  ): Promise<{ id: string; objectKey: string }> {
    const [asset] = await this.db
      .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.id, assetId),
          eq(mediaAssets.ownerUserId, ownerUserId),
          isNotNull(mediaAssets.uploadedAt),
        ),
      )
      .limit(1);

    if (!asset) {
      throw new GraphQLError('Post image is not ready', {
        extensions: { code: 'POST_IMAGE_NOT_READY' },
      });
    }

    return asset;
  }

  async getPostImageUrlService(objectKey: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: objectKey }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );
  }
}
