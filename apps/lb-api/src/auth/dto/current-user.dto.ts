import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, example: 'Nguyen Tran The Vu' })
  displayName: string | null;

  @ApiProperty({ nullable: true, example: 'https://example.com/avatar.jpg' })
  avatarUrl: string | null;

  static from(user: CurrentUserDto): CurrentUserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }
}
