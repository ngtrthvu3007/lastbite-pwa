import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';
import { StoreResolver } from './store.resolver';
import { StoreService } from './store.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [StoreService, StoreResolver],
})
export class StoreModule {}
