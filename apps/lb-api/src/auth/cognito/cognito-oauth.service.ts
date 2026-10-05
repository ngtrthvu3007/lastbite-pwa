import { BadGatewayException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import type { CognitoProfile } from './cognito-user.service';

interface VerifiedCognitoLogin {
  profile: CognitoProfile;
  refreshToken: string;
}

@Injectable()
export class CognitoOAuthService {
  constructor(
    @Inject(AUTH_CONFIG)
    private readonly config: AuthConfig,
  ) {}

  private readonly verifier = CognitoJwtVerifier.create({
    clientId: this.config.cognito.clientId,
    tokenUse: 'id',
    userPoolId: this.config.cognito.userPoolId,
  });

  private async requestTokens(code: string): Promise<{ idToken: string; refreshToken: string }> {
    const { clientId, clientSecret, domain, redirectUri } = this.config.cognito;
    const response = await fetch(new URL('/oauth2/token', domain), {
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
    if (typeof body.id_token !== 'string' || typeof body.refresh_token !== 'string') {
      throw new BadGatewayException('Cognito token response is incomplete');
    }

    return { idToken: body.id_token, refreshToken: body.refresh_token };
  }

  async exchangeCodeService(
    code: string | undefined,
    expectedNonce: string,
  ): Promise<VerifiedCognitoLogin> {
    if (!code) {
      throw new UnauthorizedException('Missing Cognito authorization code');
    }

    const tokens = await this.requestTokens(code);
    const payload = await this.verifier.verify(tokens.idToken).catch(() => {
      throw new UnauthorizedException('Cognito ID token is invalid');
    });

    const { sub, email, email_verified, nonce } = payload;
    if (nonce !== expectedNonce || email_verified !== true || typeof email !== 'string') {
      throw new UnauthorizedException('Cognito ID token is invalid');
    }

    return {
      profile: {
        cognitoSub: sub,
        email,
        displayName: optionalString(payload.name),
        avatarUrl: optionalString(payload.picture),
      },
      refreshToken: tokens.refreshToken,
    };
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
