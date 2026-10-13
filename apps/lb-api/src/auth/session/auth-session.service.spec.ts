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
    const db = { insert: jest.fn().mockReturnValue({ values: jest.fn() }) };

    const session = await new AuthSessionService(db as never).createSessionService('user-id');

    expect(session.expiresAt.getTime()).toBe(now.getTime() + sevenDaysMs);
    jest.useRealTimers();
  });

  it('returns null when no active session matches the token', async () => {
    const db = createSessionLookupDb([]);
    const service = new AuthSessionService(db as never);

    await expect(service.getCurrentUserService('revoked-token')).resolves.toBeNull();
  });

  it('revokes the Postgres session on logout', async () => {
    const where = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    const service = new AuthSessionService({ update } as never);

    await service.revokeSessionService('opaque-token');

    expect(update).toHaveBeenCalledWith(authSessions);
    expect(set).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
  });
});
