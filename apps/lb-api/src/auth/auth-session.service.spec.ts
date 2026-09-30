import { authSessions } from '../db/schema';
import { TEST_AUTH_ENV, useTestEnvironment } from '../test-support/test-environment';
import { AuthSessionService } from './auth-session.service';

const currentUser = {
  id: 'user-id',
  email: 'user@example.com',
  displayName: 'LastBite User',
  avatarUrl: null,
};

function createSessionLookupDb(result: unknown[]) {
  const limit = jest.fn().mockResolvedValue(result);
  const where = jest.fn().mockReturnValue({ limit });
  const innerJoin = jest.fn().mockReturnValue({ where });
  const from = jest.fn().mockReturnValue({ innerJoin });
  const select = jest.fn().mockReturnValue({ from });

  return { select, from, innerJoin, where, limit };
}

describe('AuthSessionService', () => {
  let restoreEnvironment: () => void;

  beforeAll(() => {
    restoreEnvironment = useTestEnvironment(TEST_AUTH_ENV);
  });

  afterAll(() => {
    restoreEnvironment();
  });

  it('stores the session in Postgres and caches its digest in Redis', async () => {
    const values = jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 'session-id' }]),
    });
    const db = {
      insert: jest.fn((table: unknown) => {
        if (table !== authSessions) throw new Error('Unexpected table');
        return { values };
      }),
    };
    const redis = { set: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthSessionService(db as never, redis as never);

    const session = await service.createSession('user-id', 'refresh-token');

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        cognitoRefreshTokenEncrypted: expect.not.stringContaining('refresh-token'),
      }),
    );
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:session:[a-f0-9]{64}$/),
      expect.any(String),
      expect.any(Number),
    );
    expect(session.token).not.toHaveLength(0);
  });

  it('keeps the Postgres session when Redis caching fails', async () => {
    const values = jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 'session-id' }]),
    });
    const db = { insert: jest.fn().mockReturnValue({ values }) };
    const redis = { set: jest.fn().mockRejectedValue(new Error('offline')) };
    const service = new AuthSessionService(db as never, redis as never);

    await expect(service.createSession('user-id', 'refresh-token')).resolves.toEqual({
      token: expect.any(String),
      expiresAt: expect.any(Date),
    });
  });

  it('rechecks the durable session before accepting a Redis cache hit', async () => {
    const db = createSessionLookupDb([currentUser]);
    const redis = {
      get: jest.fn().mockResolvedValue(
        JSON.stringify({
          id: 'session-id',
          userId: currentUser.id,
          expiresAt: '2030-01-01T00:00:00.000Z',
        }),
      ),
    };
    const service = new AuthSessionService(db as never, redis as never);

    await expect(service.getCurrentUser('opaque-token')).resolves.toEqual(currentUser);

    expect(redis.get).toHaveBeenCalledTimes(1);
    expect(db.innerJoin).toHaveBeenCalledTimes(1);
  });

  it('falls back to Postgres and warms Redis when the cache misses', async () => {
    const db = createSessionLookupDb([
      {
        id: 'session-id',
        userId: currentUser.id,
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        user: currentUser,
      },
    ]);
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthSessionService(db as never, redis as never);

    await expect(service.getCurrentUser('opaque-token')).resolves.toEqual(currentUser);

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:session:[a-f0-9]{64}$/),
      expect.stringContaining('session-id'),
      expect.any(Number),
    );
  });

  it('rejects a cached session when its durable row is revoked', async () => {
    const db = createSessionLookupDb([]);
    const redis = {
      get: jest.fn().mockResolvedValue(
        JSON.stringify({
          id: 'revoked-session-id',
          userId: currentUser.id,
          expiresAt: '2030-01-01T00:00:00.000Z',
        }),
      ),
    };
    const service = new AuthSessionService(db as never, redis as never);

    await expect(service.getCurrentUser('revoked-token')).resolves.toBeNull();
  });

  it('revokes the Postgres session and removes its cache entry on logout', async () => {
    const where = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    const redis = { del: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthSessionService({ update } as never, redis as never);

    await service.revokeSession('opaque-token');

    expect(update).toHaveBeenCalledWith(authSessions);
    expect(redis.del).toHaveBeenCalledWith(expect.stringMatching(/^auth:session:[a-f0-9]{64}$/));
  });
});
