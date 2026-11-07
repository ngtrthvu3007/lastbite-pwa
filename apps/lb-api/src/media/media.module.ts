import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';
import { MEDIA_CONFIG, createMediaConfig } from './media.config';
import { MediaResolver } from './media.resolver';
import { MediaService } from './media.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    { provide: MEDIA_CONFIG, useFactory: createMediaConfig },
    MediaService,
    MediaResolver,
  ],
  exports: [MediaService],
})
export class MediaModule {}
