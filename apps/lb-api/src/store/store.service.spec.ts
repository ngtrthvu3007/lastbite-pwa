import { PgDialect } from 'drizzle-orm/pg-core';
import { stores } from '../db/schema';
import { StoreService } from './store.service';

// Cases come from LB-18 / LB-105: owner from the session, one store per user, own store only.

const input = {
  name: 'Bánh mì Cô Hai',
  phone: '0912345678',
  address: '123 Đường Nguyễn Huệ',
};

const store = {
  id: 'store-id',
  ...input,
  createdAt: new Date('2030-01-01T00:00:00.000Z'),
};

function createStoreDb(result: unknown[]) {
  const returning = jest.fn().mockResolvedValue(result);
  const onConflictDoNothing = jest.fn().mockReturnValue({ returning });
  const values = jest.fn().mockReturnValue({ onConflictDoNothing });
  const insert = jest.fn().mockReturnValue({ values });

  return { db: { insert }, insert, values, onConflictDoNothing, returning };
}

function createFindStoreDb(result: unknown[]) {
  const limit = jest.fn().mockResolvedValue(result);
  const where = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });

  return { db: { select }, select, where };
}

describe('StoreService', () => {
  describe('createStoreService', () => {
    it('creates the store for the user in the session', async () => {
      const { db, insert, values } = createStoreDb([store]);
      const service = new StoreService(db as never);

      await expect(service.createStoreService('session-user-id', input)).resolves.toEqual(store);

      expect(insert).toHaveBeenCalledWith(stores);
      expect(values).toHaveBeenCalledWith({ ownerId: 'session-user-id', ...input });
    });

    it('ignores an owner sent by the client', async () => {
      const { db, values } = createStoreDb([store]);
      const service = new StoreService(db as never);
      const forged = { ...input, ownerId: 'someone-else' };

      await service.createStoreService('session-user-id', forged as never);

      expect(values).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'session-user-id' }));
    });

    it('returns STORE_ALREADY_EXISTS when the user already has a store', async () => {
      const { db } = createStoreDb([]);
      const service = new StoreService(db as never);

      await expect(service.createStoreService('session-user-id', input)).rejects.toMatchObject({
        extensions: { code: 'STORE_ALREADY_EXISTS' },
      });
    });

    it('does not return the owner', async () => {
      const { db, returning } = createStoreDb([store]);
      const service = new StoreService(db as never);

      await service.createStoreService('session-user-id', input);

      expect(returning.mock.calls[0][0]).not.toHaveProperty('ownerId');
    });
  });

  describe('findMyStoreService', () => {
    it('returns the store of the user', async () => {
      const { db } = createFindStoreDb([store]);
      const service = new StoreService(db as never);

      await expect(service.findMyStoreService('user-a')).resolves.toEqual(store);
    });

    it('returns null when the user has no store', async () => {
      const { db } = createFindStoreDb([]);
      const service = new StoreService(db as never);

      await expect(service.findMyStoreService('user-b')).resolves.toBeNull();
    });

    it('only looks up stores owned by the given user', async () => {
      const { db, where } = createFindStoreDb([store]);
      const service = new StoreService(db as never);

      await service.findMyStoreService('user-b');

      const { sql, params } = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
      expect(sql).toContain('"owner_id" = $1');
      expect(params).toEqual(['user-b']);
    });

    it('does not return the owner', async () => {
      const { db, select } = createFindStoreDb([store]);
      const service = new StoreService(db as never);

      await service.findMyStoreService('user-a');

      expect(select.mock.calls[0][0]).not.toHaveProperty('ownerId');
    });
  });
});
