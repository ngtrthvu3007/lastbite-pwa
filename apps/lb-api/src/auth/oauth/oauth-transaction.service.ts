import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import { AuthApp } from '../dto/auth-login-query.dto';
import { randomToken, sha256 } from '../auth.crypto';

const OAUTH_TRANSACTION_TTL_SECONDS = 10 * 60;
const OAUTH_STATE_PREFIX = 'auth:oauth:';

interface OAuthTransaction {
  nonce: string;
  returnTo: string;
}

@Injectable()
export class OAuthTransactionService {
  constructor(
    private readonly redis: RedisService,
    @Inject(AUTH_CONFIG)
    private readonly config: AuthConfig,
  ) {}

  private validateReturnTo(app: AuthApp, returnToValue: string): string {
    const appUrl = new URL(this.config.apps[app]);
    // Resolving against appUrl also accepts a relative path like "/orders".
    const returnTo = new URL(returnToValue, appUrl);

    const isSameOrigin = returnTo.origin === appUrl.origin;
    const hasCredentials = Boolean(returnTo.username || returnTo.password);

    if (!isSameOrigin || hasCredentials) {
      throw new BadRequestException('returnTo is not allowed for this app');
    }

    return returnTo.toString();
  }

  async beginTransactionService(app: AuthApp, returnToValue = ''): Promise<string> {
    const returnTo = this.validateReturnTo(app, returnToValue);
    const state = randomToken();
    const nonce = randomToken();

    // Only the digest is used as the Redis key, so a Redis dump cannot reveal
    // a state value that is still usable by the callback endpoint.
    await this.redis.set(
      stateKey(state),
      JSON.stringify({ nonce, returnTo } satisfies OAuthTransaction),
      OAUTH_TRANSACTION_TTL_SECONDS,
    );

    const authorizeUrl = new URL('/oauth2/authorize', this.config.cognito.domain);
    authorizeUrl.search = new URLSearchParams({
      client_id: this.config.cognito.clientId,
      identity_provider: 'Google',
      nonce,
      redirect_uri: this.config.cognito.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    }).toString();

    return authorizeUrl.toString();
  }

  async consumeTransactionService(state: string): Promise<OAuthTransaction> {
    // GETDEL makes validation and invalidation atomic, preventing replay.
    const raw = await this.redis.getDel(stateKey(state));
    if (!raw) throw new BadRequestException('OAuth state is invalid or expired');

    return JSON.parse(raw);
  }
}

function stateKey(state: string): string {
  return `${OAUTH_STATE_PREFIX}${sha256(state)}`;
}
