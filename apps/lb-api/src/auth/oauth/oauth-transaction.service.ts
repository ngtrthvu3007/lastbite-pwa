import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import { createRandomToken, toSha256 } from '../auth.crypto';
import {
  COGNITO_AUTHORIZE_PATH,
  COGNITO_GOOGLE_PROVIDER,
  COGNITO_PROMPT,
  COGNITO_SCOPES,
} from '../auth.constants';

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

  private buildStateKey(state: string) {
    return `${OAUTH_STATE_PREFIX}${toSha256(state)}`;
  }

  private parseUrl(value: string, base: URL): URL {
    try {
      return new URL(value, base);
    } catch {
      throw new BadRequestException('returnTo is not allowed');
    }
  }

  private validateReturnTo(returnToValue: string): string {
    const appUrl = new URL(this.config.appUrl);
    // Resolving against appUrl also accepts a relative path like "/orders".
    // new URL() throws on input like "http://", which must be a 400 like any other bad returnTo.
    const returnTo = this.parseUrl(returnToValue, appUrl);

    const isSameOrigin = returnTo.origin === appUrl.origin;
    const hasCredentials = Boolean(returnTo.username || returnTo.password);

    if (!isSameOrigin || hasCredentials) throw new BadRequestException('returnTo is not allowed');

    return returnTo.toString();
  }

  async beginTransactionService(returnToValue = ''): Promise<string> {
    const returnTo = this.validateReturnTo(returnToValue);
    const state = createRandomToken();
    const nonce = createRandomToken();

    // Only the digest is used as the Redis key, so a Redis dump cannot reveal
    // a state value that is still usable by the callback endpoint.
    await this.redis.set(
      this.buildStateKey(state),
      JSON.stringify({ nonce, returnTo } satisfies OAuthTransaction),
      OAUTH_TRANSACTION_TTL_SECONDS,
    );

    const authorizeUrl = new URL(COGNITO_AUTHORIZE_PATH, this.config.cognito.domain);
    authorizeUrl.search = new URLSearchParams({
      client_id: this.config.cognito.clientId,
      identity_provider: COGNITO_GOOGLE_PROVIDER,
      nonce,
      prompt: COGNITO_PROMPT,
      redirect_uri: this.config.cognito.redirectUri,
      response_type: 'code',
      scope: COGNITO_SCOPES,
      state,
    }).toString();

    return authorizeUrl.toString();
  }

  async consumeTransactionService(state: string): Promise<OAuthTransaction> {
    // GETDEL makes validation and invalidation atomic, preventing replay.
    const raw = await this.redis.getDel(this.buildStateKey(state));
    if (!raw) throw new BadRequestException('OAuth state is invalid or expired');

    return JSON.parse(raw);
  }
}
