import { RedisService } from '../redis/redis.module';
import { OAuthTransactionService } from './oauth-transaction.service';

describe('OAuthTransactionService', () => {
  const redis = {
    getDel: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    process.env.COGNITO_CLIENT_ID = 'client-id';
    process.env.COGNITO_DOMAIN = 'https://auth.example.com';
    process.env.COGNITO_REDIRECT_URI = 'http://localhost:3000/auth/callback';
    process.env.CUSTOMER_APP_URL = 'http://localhost:5173';
    process.env.MERCHANT_APP_URL = 'http://localhost:5174';
    jest.clearAllMocks();
  });

  it('stores a short-lived transaction and builds a direct Google authorize URL', async () => {
    const service = new OAuthTransactionService(redis as unknown as RedisService);

    const result = await service.begin(
      'customer',
      'google',
      'http://localhost:5173/orders',
    );

    const url = new URL(result);
    const state = url.searchParams.get('state');
    const nonce = url.searchParams.get('nonce');

    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('identity_provider')).toBe('Google');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(state).toBeTruthy();
    expect(nonce).toBeTruthy();
    expect(redis.set).toHaveBeenCalledWith(
      expect.not.stringContaining(state as string),
      JSON.stringify({
        nonce,
        returnTo: 'http://localhost:5173/orders',
      }),
      300,
    );
  });

  it('rejects a returnTo URL outside the selected app origin', async () => {
    const service = new OAuthTransactionService(redis as unknown as RedisService);

    await expect(
      service.begin('customer', 'google', 'https://attacker.example/callback'),
    ).rejects.toThrow('returnTo is not allowed');
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('atomically consumes a stored transaction', async () => {
    redis.getDel.mockResolvedValueOnce(
      JSON.stringify({
        nonce: 'nonce',
        returnTo: 'http://localhost:5174/posts',
      }),
    );
    const service = new OAuthTransactionService(redis as unknown as RedisService);

    await expect(service.consume('state')).resolves.toEqual({
      nonce: 'nonce',
      returnTo: 'http://localhost:5174/posts',
    });
    expect(redis.getDel).toHaveBeenCalledTimes(1);
  });
});
