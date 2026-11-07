import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsMobilePhone, IsNotEmpty, Length, Matches } from 'class-validator';

const trimText = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const PHONE_SEPARATOR_PATTERN = /[\s.-]/g;
const PHONE_COUNTRY_CODE_PATTERN = /^\+?84/;
// The vi-VN pattern in validator also lets "|" through (07|1234567); the rule is digits only.
const PHONE_DIGITS_PATTERN = /^\d+$/;

// 0901 234 567 and +84901234567 are both stored as 0901234567 (the column is varchar(10)).
const toLocalPhone = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string'
    ? value.replace(PHONE_SEPARATOR_PATTERN, '').replace(PHONE_COUNTRY_CODE_PATTERN, '0')
    : value;

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
