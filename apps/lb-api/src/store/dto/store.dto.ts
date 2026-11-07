import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsMobilePhone, IsNotEmpty, Length, Matches } from 'class-validator';
import { LOCAL_PHONE_DIGITS_PATTERN, toLocalPhone } from '../../common';

const trimText = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

// ownerId is deliberately not exposed: the owner is always the signed-in user.
@ObjectType('Store')
export class StoreDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  phone: string;

  @Field()
  address: string;

  @Field()
  createdAt: Date;
}

// Messages are error codes: the client maps them to its own text. Keep in sync with the
// Validation rules in the LB-18 Notion page.
@InputType()
export class CreateStoreInput {
  @Field()
  @Transform(trimText)
  @IsNotEmpty({ message: 'NAME_REQUIRED' })
  @Length(2, 100, { message: 'NAME_INVALID' })
  name: string;

  @Field()
  @Transform(({ value }: TransformFnParams) => toLocalPhone(value))
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  @IsMobilePhone('vi-VN', undefined, { message: 'PHONE_INVALID' })
  @Matches(LOCAL_PHONE_DIGITS_PATTERN, { message: 'PHONE_INVALID' })
  phone: string;

  @Field()
  @Transform(trimText)
  @IsNotEmpty({ message: 'ADDRESS_REQUIRED' })
  @Length(5, 255, { message: 'ADDRESS_INVALID' })
  address: string;
}
