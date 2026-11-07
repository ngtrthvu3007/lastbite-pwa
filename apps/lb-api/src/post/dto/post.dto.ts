import { Field, GraphQLISODateTime, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

const PHONE_SEPARATOR_PATTERN = /[\s.-]/g;
const PHONE_COUNTRY_CODE_PATTERN = /^\+?84/;
const PHONE_DIGITS_PATTERN = /^\d+$/;

const trimText = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toLocalPhone = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string'
    ? value.replace(PHONE_SEPARATOR_PATTERN, '').replace(PHONE_COUNTRY_CODE_PATTERN, '0')
    : value;

@InputType()
export class CreatePostInput {
  @Field(() => ID)
  @IsUUID(undefined, { message: 'IMAGE_ASSET_INVALID' })
  imageAssetId: string;

  @Field()
  @Transform(trimText)
  @IsNotEmpty({ message: 'TITLE_REQUIRED' })
  @Length(2, 120, { message: 'TITLE_INVALID' })
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(trimText)
  @Length(1, 1000, { message: 'DESCRIPTION_INVALID' })
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'ORIGINAL_PRICE_INVALID' })
  @Min(0, { message: 'ORIGINAL_PRICE_INVALID' })
  originalPrice?: number;

  @Field(() => Int)
  @IsInt({ message: 'CURRENT_PRICE_INVALID' })
  @Min(0, { message: 'CURRENT_PRICE_INVALID' })
  currentPrice: number;

  @Field(() => Int)
  @IsInt({ message: 'QUANTITY_INVALID' })
  @Min(1, { message: 'QUANTITY_INVALID' })
  quantity: number;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate({ message: 'PICKUP_START_INVALID' })
  pickupStartAt: Date;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate({ message: 'PICKUP_END_INVALID' })
  pickupEndAt: Date;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate({ message: 'EXPIRY_INVALID' })
  expiresAt: Date;

  @Field()
  @Transform(trimText)
  @IsNotEmpty({ message: 'STORE_NAME_REQUIRED' })
  @Length(2, 100, { message: 'STORE_NAME_INVALID' })
  storeName: string;

  @Field()
  @Transform(toLocalPhone)
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  @IsMobilePhone('vi-VN', undefined, { message: 'PHONE_INVALID' })
  @Matches(PHONE_DIGITS_PATTERN, { message: 'PHONE_INVALID' })
  phone: string;

  @Field()
  @Transform(trimText)
  @IsNotEmpty({ message: 'ADDRESS_REQUIRED' })
  @Length(5, 255, { message: 'ADDRESS_INVALID' })
  address: string;
}

@ObjectType('Post')
export class PostDto {
  @Field(() => ID)
  id: string;

  @Field()
  imageUrl: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string | null;

  @Field(() => Int, { nullable: true })
  originalPrice: number | null;

  @Field(() => Int)
  currentPrice: number;

  @Field(() => Int)
  remainingQuantity: number;

  @Field(() => GraphQLISODateTime)
  pickupStartAt: Date;

  @Field(() => GraphQLISODateTime)
  pickupEndAt: Date;

  @Field(() => GraphQLISODateTime)
  expiresAt: Date;

  @Field()
  storeName: string;

  @Field()
  phone: string;

  @Field()
  address: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}
