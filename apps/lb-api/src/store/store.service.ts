import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { DB, Database } from '../db/database.module';
import { stores } from '../db/schema';
import { CreateStoreInput, StoreDto } from './dto/store.dto';

const STORE_COLUMNS = {
  id: stores.id,
  name: stores.name,
  phone: stores.phone,
  address: stores.address,
  createdAt: stores.createdAt,
};

@Injectable()
export class StoreService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findMyStoreService(ownerId: string): Promise<StoreDto | null> {
    const [store] = await this.db
      .select(STORE_COLUMNS)
      .from(stores)
      .where(eq(stores.ownerId, ownerId))
      .limit(1);

    return store ?? null;
  }

  async createStoreService(ownerId: string, input: CreateStoreInput): Promise<StoreDto> {
    // The owner comes from the session, never from the client. The unique owner_id decides
    // the winner when two requests race, so no read-then-insert check is needed.
    const [store] = await this.db
      .insert(stores)
      .values({ ownerId, name: input.name, phone: input.phone, address: input.address })
      .onConflictDoNothing({ target: stores.ownerId })
      .returning(STORE_COLUMNS);

    if (!store) {
      throw new GraphQLError('Store already exists', {
        extensions: { code: 'STORE_ALREADY_EXISTS' },
      });
    }

    return store;
  }
}
