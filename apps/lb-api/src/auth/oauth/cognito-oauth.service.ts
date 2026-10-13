import { BadGatewayException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import type { UserProfile } from '../user.service';
import { COGNITO_TOKEN_PATH } from '../auth.constants';

const INVALID_ID_TOKEN_MESSAGE = 'Cognito ID token is invalid';

// Claims of our own user pool's ID token, shaped by the Google attribute mapping.
interface IdTokenClaims extends CognitoIdTokenPayload {
  nonce?: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class CognitoOAuthService {
  private readonly verifier: ReturnType<typeof createVerifier>;

  constructor(
    @Inject(AUTH_CONFIG)
    private readonly config: AuthConfig,
  ) {
    this.verifier = createVerifier(config.cognito);
  }

  private async requestIdToken(code: string): Promise<string> {
    const { clientId, clientSecret, domain, redirectUri } = this.config.cognito;
    const response = await fetch(new URL(COGNITO_TOKEN_PATH, domain), {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new BadGatewayException('Cognito token exchange failed');
    }

    const body = (await response.json()) as Record<string, unknown>;
    if (typeof body.id_token !== 'string')
      throw new BadGatewayException('Cognito token response is incomplete');

    return body.id_token;
  }

  async exchangeCodeService(code: string | undefined, expectedNonce: string): Promise<UserProfile> {
    if (!code) throw new UnauthorizedException('Missing Cognito authorization code');

    const idToken = await this.requestIdToken(code);
    const payload = await this.verifier.verify(idToken).catch(() => {
      throw new UnauthorizedException(INVALID_ID_TOKEN_MESSAGE);
    });

    // The signature is already verified, so the claims are trusted; cast once instead of
    // checking each type.
    const claims = payload as IdTokenClaims;
    const isNonceValid = claims.nonce === expectedNonce;
    const isEmailVerified = Boolean(claims.email_verified);

    if (!isNonceValid || !isEmailVerified)
      throw new UnauthorizedException(INVALID_ID_TOKEN_MESSAGE);

    return {
      cognitoSub: claims.sub,
      email: claims.email,
      displayName: claims.name ?? null,
      avatarUrl: claims.picture ?? null,
    };
  }
}

function createVerifier({ clientId, userPoolId }: AuthConfig['cognito']) {
  return CognitoJwtVerifier.create({ clientId, tokenUse: 'id', userPoolId });
}
