import { RedisService } from '../redis/redis.module';
import { TEST_AUTH_ENV, useTestEnvironment } from '../test-support/test-environment';
import { OAuthTransactionService } from './oauth-transaction.service';

describe('OAuthTransactionService', () => {
  let restoreEnvironment: () => void;

  const redis = {
    getDel: jest.fn(),
    set: jest.fn(),
  };

  beforeAll(() => {
    restoreEnvironment = useTestEnvironment(TEST_AUTH_ENV);
  });

  afterAll(() => {
    restoreEnvironment();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores a short-lived transaction and builds a direct Google authorize URL', async () => {
    const service = new OAuthTransactionService(redis as unknown as RedisService);

    const result = await service.begin('customer', 'google', 'http://customer.test/orders');

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
        returnTo: 'http://customer.test/orders',
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
        returnTo: 'http://merchant.test/posts',
      }),
    );
    const service = new OAuthTransactionService(redis as unknown as RedisService);

    await expect(service.consume('state')).resolves.toEqual({
      nonce: 'nonce',
      returnTo: 'http://merchant.test/posts',
    });
    expect(redis.getDel).toHaveBeenCalledTimes(1);
  });
});
