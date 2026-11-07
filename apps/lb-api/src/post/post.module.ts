import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';
import { MediaModule } from '../media/media.module';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';

@Module({
  imports: [DatabaseModule, AuthModule, MediaModule],
  providers: [PostService, PostResolver],
})
export class PostModule {}
