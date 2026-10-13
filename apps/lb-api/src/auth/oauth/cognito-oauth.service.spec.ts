import { BadGatewayException, UnauthorizedException } from '@nestjs/common';
import { AuthConfig } from '../auth.config';
import { COGNITO_TOKEN_PATH } from '../auth.constants';
import { CognitoOAuthService } from './cognito-oauth.service';

const mockVerify = jest.fn();
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: () => ({ verify: mockVerify }) },
}));

const CODE = 'code';
const NONCE = 'expected-nonce';
const ID_TOKEN = 'id-token';
const COGNITO_DOMAIN = 'https://auth.example.com';
const CLAIMS = {
  sub: 'cognito-sub',
  email: 'customer@example.com',
  email_verified: true,
  nonce: NONCE,
  name: 'Customer',
  picture: 'https://example.com/avatar.jpg',
};

const config: AuthConfig = {
  apps: { customer: 'http://localhost:5173', merchant: 'http://localhost:5174' },
  cognito: {
    clientId: 'client-id',
    clientSecret: 'client-secret',
    domain: COGNITO_DOMAIN,
    redirectUri: 'http://localhost:3000/auth/callback',
    userPoolId: 'pool-id',
  },
};

function mockTokenResponse(ok: boolean, body: object = { id_token: ID_TOKEN }) {
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok, json: async () => body } as Response);
}

describe('CognitoOAuthService.exchangeCodeService', () => {
  const service = new CognitoOAuthService(config);

  beforeEach(() => {
    jest.restoreAllMocks();
    mockVerify.mockReset();
  });

  it('exchanges the code at the Cognito token endpoint and returns the user profile', async () => {
    mockTokenResponse(true);
    mockVerify.mockResolvedValue(CLAIMS);

    await expect(service.exchangeCodeService(CODE, NONCE)).resolves.toEqual({
      cognitoSub: CLAIMS.sub,
      email: CLAIMS.email,
      displayName: CLAIMS.name,
      avatarUrl: CLAIMS.picture,
    });

    expect(String(jest.mocked(fetch).mock.calls[0][0])).toBe(
      new URL(COGNITO_TOKEN_PATH, COGNITO_DOMAIN).toString(),
    );
    expect(mockVerify).toHaveBeenCalledWith(ID_TOKEN);
  });

  it('authenticates the token request as the confidential backend client', async () => {
    mockTokenResponse(true);
    mockVerify.mockResolvedValue(CLAIMS);

    await service.exchangeCodeService(CODE, NONCE);

    const init = jest.mocked(fetch).mock.calls[0][1] as RequestInit;
    const { clientId, clientSecret, redirectUri } = config.cognito;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    expect((init.headers as Record<string, string>).authorization).toBe(`Basic ${basic}`);
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      client_id: clientId,
      code: CODE,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
  });

  it('returns null for name and picture when the token has none', async () => {
    mockTokenResponse(true);
    mockVerify.mockResolvedValue({ ...CLAIMS, name: undefined, picture: undefined });

    await expect(service.exchangeCodeService(CODE, NONCE)).resolves.toMatchObject({
      displayName: null,
      avatarUrl: null,
    });
  });

  it('rejects a callback without an authorization code', async () => {
    await expect(service.exchangeCodeService(undefined, NONCE)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('fails with 502 when Cognito rejects the token exchange', async () => {
    mockTokenResponse(false);

    await expect(service.exchangeCodeService(CODE, NONCE)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('fails with 502 when the token response has no ID token', async () => {
    mockTokenResponse(true, {});

    await expect(service.exchangeCodeService(CODE, NONCE)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it.each([
    ['fails verification', () => mockVerify.mockRejectedValue(new Error('bad signature'))],
    [
      'has a nonce that does not match',
      () => mockVerify.mockResolvedValue({ ...CLAIMS, nonce: 'x' }),
    ],
    [
      'has an unverified email',
      () => mockVerify.mockResolvedValue({ ...CLAIMS, email_verified: false }),
    ],
  ])('rejects an ID token that %s', async (_reason, arrangeVerifier) => {
    mockTokenResponse(true);
    arrangeVerifier();

    await expect(service.exchangeCodeService(CODE, NONCE)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
