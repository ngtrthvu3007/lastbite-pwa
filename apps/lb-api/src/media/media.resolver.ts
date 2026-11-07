import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, CurrentUserDto } from '../common';
import { CreatePostImageUploadInput, PostImageAssetDto, PostImageUploadDto } from './dto/media.dto';
import { MediaService } from './media.service';

@Resolver()
@UseGuards(AuthGuard)
export class MediaResolver {
  constructor(private readonly mediaService: MediaService) {}

  @Mutation(() => PostImageUploadDto, { name: 'createPostImageUpload' })
  createPostImageUploadResolver(
    @CurrentUser() user: CurrentUserDto,
    @Args('input') input: CreatePostImageUploadInput,
  ): Promise<PostImageUploadDto> {
    return this.mediaService.createPostImageUploadService(user.id, input);
  }

  @Mutation(() => PostImageAssetDto, { name: 'completePostImageUpload' })
  completePostImageUploadResolver(
    @CurrentUser() user: CurrentUserDto,
    @Args('assetId', { type: () => ID }, new ParseUUIDPipe()) assetId: string,
  ): Promise<PostImageAssetDto> {
    return this.mediaService.completePostImageUploadService(user.id, assetId);
  }
}
