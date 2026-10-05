import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export type AuthApp = 'customer' | 'merchant';
export const AUTH_APPS: AuthApp[] = ['customer', 'merchant'];

export class AuthLoginQueryDto {
  @ApiProperty({ enum: AUTH_APPS, description: 'The app to return to after a successful login.' })
  @IsIn(AUTH_APPS, { message: 'app must be customer or merchant' })
  app: AuthApp;

  @ApiPropertyOptional({ description: 'Optional path or URL on the selected app origin.' })
  @IsOptional()
  @IsString()
  returnTo?: string;
}
