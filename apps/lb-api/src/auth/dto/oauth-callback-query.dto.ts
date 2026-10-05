import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class OAuthCallbackQueryDto {
  @ApiPropertyOptional({
    description:
      'Authorization code returned on successful login. Required unless error is present.',
  })
  @ValidateIf((query: OAuthCallbackQueryDto) => !query.error)
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiProperty({ description: 'OAuth state returned by Cognito.' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ description: 'OAuth error returned when the user denies login.' })
  @IsOptional()
  @IsString()
  error?: string;
}
