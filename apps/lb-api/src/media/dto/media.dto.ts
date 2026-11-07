import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsIn } from 'class-validator';

const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

@InputType()
export class CreatePostImageUploadInput {
  @Field(() => String)
  @IsIn(IMAGE_CONTENT_TYPES, { message: 'IMAGE_CONTENT_TYPE_INVALID' })
  contentType: (typeof IMAGE_CONTENT_TYPES)[number];
}

@ObjectType('PostImageUpload')
export class PostImageUploadDto {
  @Field(() => ID)
  assetId: string;

  @Field()
  uploadUrl: string;

  @Field(() => [PostImageUploadFieldDto])
  fields: PostImageUploadFieldDto[];

  @Field()
  expiresAt: Date;
}

@ObjectType('PostImageUploadField')
export class PostImageUploadFieldDto {
  @Field()
  name: string;

  @Field()
  value: string;
}

@ObjectType('PostImageAsset')
export class PostImageAssetDto {
  @Field(() => ID)
  id: string;
}
