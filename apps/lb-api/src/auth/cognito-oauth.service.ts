import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

interface VerifiedCognitoLogin {
  profile: {
    cognitoSub: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  refreshToken: string;
}

@Injectable()
export class CognitoOAuthService {
  private readonly clientId = requiredEnv('COGNITO_CLIENT_ID');
  private readonly clientSecret = requiredEnv('COGNITO_CLIENT_SECRET');
  private readonly cognitoDomain = requiredEnv('COGNITO_DOMAIN');
  private readonly redirectUri = requiredEnv('COGNITO_REDIRECT_URI');
  private readonly verifier = CognitoJwtVerifier.create({
    clientId: this.clientId,
    tokenUse: 'id',
    userPoolId: requiredEnv('COGNITO_USER_POOL_ID'),
  });

  async exchangeCode(code: string | undefined, expectedNonce: string): Promise<VerifiedCognitoLogin> {
    if (!code) {
      throw new UnauthorizedException('Missing Cognito authorization code');
    }

    const tokens = await this.requestTokens(code);

    try {
      // aws-jwt-verify validates the signature/JWKS, issuer, client ID and time
      // claims. Nonce is checked separately because it belongs to our login transaction.
      const payload = await this.verifier.verify(tokens.idToken);
      if (payload.nonce !== expectedNonce) {
        throw new Error('Nonce mismatch');
      }

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        payload.email_verified !== true
      ) {
        throw new Error('Required identity claims are missing');
      }

      return {
        profile: {
          cognitoSub: payload.sub,
          email: payload.email,
          displayName: optionalString(payload.name),
          avatarUrl: optionalString(payload.picture),
        },
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Cognito ID token is invalid');
    }
  }

  private async requestTokens(code: string): Promise<{ idToken: string; refreshToken: string }> {
    const response = await fetch(new URL('/oauth2/token', this.cognitoDomain), {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
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
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
