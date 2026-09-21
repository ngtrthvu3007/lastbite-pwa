import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { RedisService } from '../redis/redis.module';

const OAUTH_TRANSACTION_TTL_SECONDS = 5 * 60;
const OAUTH_STATE_PREFIX = 'auth:oauth:';

type AuthApp = 'customer' | 'merchant';

interface OAuthTransaction {
  nonce: string;
  returnTo: string;
}

@Injectable()
export class OAuthTransactionService {
  private readonly clientId = requiredEnv('COGNITO_CLIENT_ID');
  private readonly cognitoDomain = requiredEnv('COGNITO_DOMAIN');
  private readonly redirectUri = requiredEnv('COGNITO_REDIRECT_URI');
  private readonly appUrls: Record<AuthApp, string> = {
    customer: requiredEnv('CUSTOMER_APP_URL'),
    merchant: requiredEnv('MERCHANT_APP_URL'),
  };

  constructor(private readonly redis: RedisService) {}

  async begin(
    appValue: string | undefined,
    provider: string | undefined,
    returnToValue: string | undefined,
  ): Promise<string> {
    const app = parseApp(appValue);

    if ((provider ?? 'google').toLowerCase() !== 'google') {
      throw new BadRequestException('Only Google login is supported');
    }

    const returnTo = this.validateReturnTo(app, returnToValue);
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');

    // Only the digest is used as the Redis key, so a Redis dump cannot reveal
    // a state value that is still usable by the callback endpoint.
    await this.redis.set(
      stateKey(state),
      JSON.stringify({ nonce, returnTo } satisfies OAuthTransaction),
      OAUTH_TRANSACTION_TTL_SECONDS,
    );

    const authorizeUrl = new URL('/oauth2/authorize', this.cognitoDomain);
    authorizeUrl.search = new URLSearchParams({
      client_id: this.clientId,
      identity_provider: 'Google',
      nonce,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    }).toString();

    return authorizeUrl.toString();
  }

  async consume(state: string | undefined): Promise<OAuthTransaction> {
    if (!state) {
      throw new BadRequestException('Missing OAuth state');
    }

    // GETDEL makes validation and invalidation atomic, preventing replay.
    const rawTransaction = await this.redis.getDel(stateKey(state));
    if (!rawTransaction) {
      throw new BadRequestException('OAuth state is invalid or expired');
    }

    try {
      const transaction = JSON.parse(rawTransaction) as Partial<OAuthTransaction>;
      if (
        typeof transaction.nonce !== 'string' ||
        typeof transaction.returnTo !== 'string'
      ) {
        throw new Error('Invalid OAuth transaction');
      }

      return transaction as OAuthTransaction;
    } catch {
      throw new BadRequestException('OAuth state is invalid or expired');
    }
  }

  private validateReturnTo(app: AuthApp, returnToValue: string | undefined): string {
    const appUrl = new URL(this.appUrls[app]);
    const returnTo = new URL(returnToValue ?? appUrl.toString());

    if (
      returnTo.origin !== appUrl.origin ||
      returnTo.username ||
      returnTo.password
    ) {
      throw new BadRequestException('returnTo is not allowed for this app');
    }

    return returnTo.toString();
  }
}

function parseApp(value: string | undefined): AuthApp {
  if (value === 'customer' || value === 'merchant') {
    return value;
  }

  throw new BadRequestException('app must be customer or merchant');
}

function stateKey(state: string): string {
  return `${OAUTH_STATE_PREFIX}${createHash('sha256').update(state).digest('hex')}`;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
