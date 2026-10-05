import { authSessions } from '../../db/schema';
import { createAuthConfig } from '../auth.config';
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
  const config = createAuthConfig();

  it('stores only the session digest in Postgres', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const db = {
      insert: jest.fn((table: unknown) => {
        if (table !== authSessions) throw new Error('Unexpected table');
        return { values };
      }),
    };
    const service = new AuthSessionService(db as never, config);

    const session = await service.createSessionService('user-id', 'refresh-token');

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        cognitoRefreshTokenEncrypted: expect.not.stringContaining('refresh-token'),
      }),
    );
    expect(session.token).not.toHaveLength(0);
  });

  it('returns the user from an active Postgres session', async () => {
    const db = createSessionLookupDb([currentUser]);
    const service = new AuthSessionService(db as never, config);

    await expect(service.getCurrentUserService('opaque-token')).resolves.toEqual(currentUser);
  });

  it('rejects a missing, expired, or revoked Postgres session', async () => {
    const db = createSessionLookupDb([]);
    const service = new AuthSessionService(db as never, config);

    await expect(service.getCurrentUserService('revoked-token')).resolves.toBeNull();
  });

  it('revokes the Postgres session on logout', async () => {
    const where = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    const service = new AuthSessionService({ update } as never, config);

    await service.revokeSessionService('opaque-token');

    expect(update).toHaveBeenCalledWith(authSessions);
  });
});
