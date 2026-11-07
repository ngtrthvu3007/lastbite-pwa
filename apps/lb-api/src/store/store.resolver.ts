import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, CurrentUserDto } from '../common';
import { CreateStoreInput, StoreDto } from './dto/store.dto';
import { StoreService } from './store.service';

@Resolver()
@UseGuards(AuthGuard)
export class StoreResolver {
  constructor(private readonly storeService: StoreService) {}

  // Takes no id: a user can only ever read their own store.
  @Query(() => StoreDto, { name: 'myStore', nullable: true })
  myStoreResolver(@CurrentUser() user: CurrentUserDto): Promise<StoreDto | null> {
    return this.storeService.findMyStoreService(user.id);
  }

  @Mutation(() => StoreDto, { name: 'createStore' })
  createStoreResolver(
    @CurrentUser() user: CurrentUserDto,
    @Args('input') input: CreateStoreInput,
  ): Promise<StoreDto> {
    return this.storeService.createStoreService(user.id, input);
  }
}
