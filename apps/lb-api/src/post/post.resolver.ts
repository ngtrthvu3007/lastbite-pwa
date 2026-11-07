import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, CurrentUserDto } from '../common';
import { ClosePostInput, CreatePostInput, PostDto } from './dto/post.dto';
import { PostService } from './post.service';

@Resolver()
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Mutation(() => PostDto, { name: 'createPost' })
  @UseGuards(AuthGuard)
  createPostResolver(
    @CurrentUser() user: CurrentUserDto,
    @Args('input') input: CreatePostInput,
  ): Promise<PostDto> {
    return this.postService.createPostService(user.id, input);
  }

  @Mutation(() => PostDto, { name: 'closePost' })
  @UseGuards(AuthGuard)
  closePostResolver(
    @CurrentUser() user: CurrentUserDto,
    @Args('input') input: ClosePostInput,
  ): Promise<PostDto> {
    return this.postService.closePostService(user.id, input.postId);
  }

  @Query(() => [PostDto], { name: 'activePosts' })
  activePostsResolver(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<PostDto[]> {
    return this.postService.findActivePostsService(limit);
  }

  @Query(() => PostDto, { name: 'post', nullable: true })
  postResolver(
    @Args('id', { type: () => ID }, new ParseUUIDPipe()) id: string,
  ): Promise<PostDto | null> {
    return this.postService.findPublicPostService(id);
  }
}
