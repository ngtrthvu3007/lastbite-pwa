import { ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';

export class CurrentUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, example: 'Nguyen Tran The Vu' })
  displayName: string | null;

  @ApiProperty({ nullable: true, example: 'https://example.com/avatar.jpg' })
  avatarUrl: string | null;
}

export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUserDto;
}
