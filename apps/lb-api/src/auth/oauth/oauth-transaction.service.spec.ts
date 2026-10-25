import { RedisService } from '../../redis/redis.service';
import { createAuthConfig } from '../auth.config';
import {
  COGNITO_AUTHORIZE_PATH,
  COGNITO_GOOGLE_PROVIDER,
  COGNITO_PROMPT,
  COGNITO_SCOPES,
} from '../auth.constants';
import { OAuthTransactionService } from './oauth-transaction.service';

const config = createAuthConfig();

const RETURN_PATH = '/orders';
const RETURN_TO = new URL(RETURN_PATH, config.appUrl).toString();
const MERCHANT_RETURN_TO = new URL('/merchant/posts', config.appUrl).toString();
const FOREIGN_RETURN_TO = 'https://attacker.example/callback';
const RESPONSE_TYPE = 'code';
const TRANSACTION_TTL_SECONDS = 10 * 60;
const STATE = 'state';
const NONCE = 'nonce';

describe('OAuthTransactionService', () => {
  const redis = {
    getDel: jest.fn(),
    set: jest.fn(),
  };
  const service = new OAuthTransactionService(redis as unknown as RedisService, config);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores a short-lived transaction and builds a direct Google authorize URL', async () => {
    const result = await service.beginTransactionService(RETURN_TO);

    const url = new URL(result);
    const state = url.searchParams.get('state');
    const nonce = url.searchParams.get('nonce');

    expect(url.pathname).toBe(COGNITO_AUTHORIZE_PATH);
    expect(url.searchParams.get('identity_provider')).toBe(COGNITO_GOOGLE_PROVIDER);
    expect(url.searchParams.get('response_type')).toBe(RESPONSE_TYPE);
    expect(url.searchParams.get('scope')).toBe(COGNITO_SCOPES);
    expect(url.searchParams.get('prompt')).toBe(COGNITO_PROMPT);
    expect(state).toBeTruthy();
    expect(nonce).toBeTruthy();
    expect(redis.set).toHaveBeenCalledWith(
      expect.not.stringContaining(state as string),
      JSON.stringify({ nonce, returnTo: RETURN_TO }),
      TRANSACTION_TTL_SECONDS,
    );
  });

  it('resolves a relative returnTo path against the app origin', async () => {
    await service.beginTransactionService(RETURN_PATH);

    expect(redis.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(JSON.stringify(RETURN_TO)),
      TRANSACTION_TTL_SECONDS,
    );
  });

  it('rejects a returnTo URL outside the selected app origin', async () => {
    await expect(service.beginTransactionService(FOREIGN_RETURN_TO)).rejects.toThrow(
      'returnTo is not allowed',
    );
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('allows customer and merchant paths on the same web app origin', async () => {
    await service.beginTransactionService(MERCHANT_RETURN_TO);

    expect(redis.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(JSON.stringify(MERCHANT_RETURN_TO)),
      TRANSACTION_TTL_SECONDS,
    );
  });

  it('rejects a returnTo URL that carries credentials', async () => {
    const withCredentials = new URL(RETURN_PATH, config.appUrl);
    withCredentials.username = 'user';

    await expect(service.beginTransactionService(withCredentials.toString())).rejects.toThrow(
      'returnTo is not allowed',
    );
  });

  it('rejects an unknown or already used state', async () => {
    redis.getDel.mockResolvedValueOnce(null);

    await expect(service.consumeTransactionService(STATE)).rejects.toThrow(
      'OAuth state is invalid or expired',
    );
  });

  it('atomically consumes a stored transaction', async () => {
    const transaction = { nonce: NONCE, returnTo: MERCHANT_RETURN_TO };
    redis.getDel.mockResolvedValueOnce(JSON.stringify(transaction));

    await expect(service.consumeTransactionService(STATE)).resolves.toEqual(transaction);
    expect(redis.getDel).toHaveBeenCalledTimes(1);
  });
});
