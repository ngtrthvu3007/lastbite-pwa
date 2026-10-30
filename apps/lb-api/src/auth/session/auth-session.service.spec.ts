import { authSessions } from '../../db/schema';
import { AuthSessionService } from './auth-session.service';

function createSessionLookupDb(result: unknown[]) {
  const limit = jest.fn().mockResolvedValue(result);
  const where = jest.fn().mockReturnValue({ limit });
  const innerJoin = jest.fn().mockReturnValue({ where });
  const from = jest.fn().mockReturnValue({ innerJoin });
  const select = jest.fn().mockReturnValue({ from });

  return { select, from, innerJoin, where, limit };
}

describe('AuthSessionService', () => {
  it('stores only the session digest in Postgres', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const db = {
      insert: jest.fn((table: unknown) => {
        if (table !== authSessions) throw new Error('Unexpected table');
        return { values };
      }),
    };
    const service = new AuthSessionService(db as never);

    const session = await service.createSessionService('user-id');

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(session.token).not.toHaveLength(0);
  });

  it('creates a session that lasts exactly the 7-day maximum', async () => {
    const now = new Date('2030-01-01T00:00:00.000Z');
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    jest.useFakeTimers().setSystemTime(now);
    const values = jest.fn();
    const db = { insert: jest.fn().mockReturnValue({ values }) };

    const session = await new AuthSessionService(db as never).createSessionService('user-id');

    expect(session.expiresAt.getTime()).toBe(now.getTime() + sevenDaysMs);
    // createdAt is sent too: the DB default now() would make expiresAt exceed created_at + 7 days.
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: now, expiresAt: session.expiresAt }),
    );
    jest.useRealTimers();
  });

  it('returns null when no active session matches the token', async () => {
    const db = createSessionLookupDb([]);
    const service = new AuthSessionService(db as never);

    await expect(service.getActiveSessionService('revoked-token')).resolves.toBeNull();
  });

  describe('rotateSessionService', () => {
    function createRotationDb(updated: unknown[]) {
      const values = jest.fn().mockResolvedValue(undefined);
      const returning = jest.fn().mockResolvedValue(updated);
      const where = jest.fn().mockReturnValue({ returning });
      const set = jest.fn().mockReturnValue({ where });
      const tx = {
        update: jest.fn().mockReturnValue({ set }),
        insert: jest.fn().mockReturnValue({ values }),
      };
      const db = { transaction: jest.fn((run: (tx: unknown) => unknown) => run(tx)) };

      return { db, tx, set, values };
    }

    afterEach(() => jest.useRealTimers());

    it('returns null and creates nothing when no live session matches (already rotated or revoked)', async () => {
      const { db, tx } = createRotationDb([]);

      await expect(
        new AuthSessionService(db as never).rotateSessionService('opaque-token'),
      ).resolves.toBeNull();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it('shortens the old session to the grace end and issues a new 7-day session', async () => {
      const now = new Date('2030-01-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      const { db, set, values } = createRotationDb([{ userId: 'user-id' }]);

      const session = await new AuthSessionService(db as never).rotateSessionService(
        'opaque-token',
      );

      expect(set).toHaveBeenCalledWith({ expiresAt: new Date(now.getTime() + 2 * 60 * 1000) });
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          createdAt: now,
          expiresAt: session?.expiresAt,
        }),
      );
      expect(session?.expiresAt.getTime()).toBe(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('revokeSessionService', () => {
    // The first update (the session itself) ends in returning(); the second (its grace siblings) is awaited as is.
    function createRevokeDb(revoked: unknown[]) {
      const returning = jest.fn().mockResolvedValue(revoked);
      const where = jest.fn().mockReturnValueOnce({ returning }).mockResolvedValueOnce(undefined);
      const set = jest.fn().mockReturnValue({ where });
      const tx = { update: jest.fn().mockReturnValue({ set }) };
      const db = { transaction: jest.fn((run: (tx: unknown) => unknown) => run(tx)) };

      return { db, tx, set };
    }

    afterEach(() => jest.useRealTimers());

    it('revokes the session and the sessions of that user still in their grace period', async () => {
      const now = new Date('2030-01-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      const { db, tx, set } = createRevokeDb([{ userId: 'user-id' }]);

      await new AuthSessionService(db as never).revokeSessionService('opaque-token');

      expect(tx.update).toHaveBeenCalledTimes(2);
      expect(tx.update).toHaveBeenCalledWith(authSessions);
      expect(set).toHaveBeenNthCalledWith(1, { revokedAt: now });
      expect(set).toHaveBeenNthCalledWith(2, { revokedAt: now });
    });

    it('revokes nothing else when the token matches no live session', async () => {
      const { db, tx } = createRevokeDb([]);

      await new AuthSessionService(db as never).revokeSessionService('unknown-token');

      expect(tx.update).toHaveBeenCalledTimes(1);
    });
  });
});
