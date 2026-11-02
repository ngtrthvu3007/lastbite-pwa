import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserDto } from '../../common';

export class AuthMeResponseDto extends CurrentUserDto {
  @ApiProperty({
    description: 'Whether the user owns a store. A UI hint only, not a permission.',
    example: false,
  })
  hasStore: boolean;
}
