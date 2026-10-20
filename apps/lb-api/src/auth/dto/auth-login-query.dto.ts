import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AuthLoginQueryDto {
  @ApiPropertyOptional({ description: 'Optional path or URL on the LastBite web app origin.' })
  @IsOptional()
  @IsString()
  returnTo?: string;
}
