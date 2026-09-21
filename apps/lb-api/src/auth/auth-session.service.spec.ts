import { authSessions } from '../db/schema';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const previousKey = process.env.AUTH_REFRESH_TOKEN_KEY;

  beforeAll(() => {
    process.env.AUTH_REFRESH_TOKEN_KEY = Buffer.alloc(32, 7).toString('base64');
  });

  afterAll(() => {
    if (previousKey === undefined) {
      delete process.env.AUTH_REFRESH_TOKEN_KEY;
    } else {
      process.env.AUTH_REFRESH_TOKEN_KEY = previousKey;
    }
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
        cognitoRefreshTokenEncrypted:
          expect.not.stringContaining('refresh-token'),
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

    await expect(
      service.createSession('user-id', 'refresh-token'),
    ).resolves.toEqual({
      token: expect.any(String),
      expiresAt: expect.any(Date),
    });
  });
});
