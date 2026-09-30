import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const oauthTransactions = { begin: jest.fn(), consume: jest.fn() };
  const cognitoOAuth = { exchangeCode: jest.fn() };
  const cognitoUsers = { syncUser: jest.fn() };
  const authSessions = {
    createSession: jest.fn(),
    getCurrentUser: jest.fn(),
    revokeSession: jest.fn(),
  };
  const service = new AuthService(
    oauthTransactions as never,
    cognitoOAuth as never,
    cognitoUsers as never,
    authSessions as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('orchestrates a successful OAuth callback into a LastBite session', async () => {
    const profile = {
      cognitoSub: 'cognito-sub',
      email: 'customer@example.com',
      displayName: 'Customer',
      avatarUrl: null,
    };
    const expiresAt = new Date('2030-01-08T00:00:00.000Z');
    oauthTransactions.consume.mockResolvedValue({
      nonce: 'expected-nonce',
      returnTo: 'http://localhost:5173/orders',
    });
    cognitoOAuth.exchangeCode.mockResolvedValue({ profile, refreshToken: 'refresh-token' });
    cognitoUsers.syncUser.mockResolvedValue('user-id');
    authSessions.createSession.mockResolvedValue({ token: 'opaque-token', expiresAt });

    await expect(service.completeLogin('code', 'state', undefined)).resolves.toEqual({
      token: 'opaque-token',
      expiresAt,
      returnTo: 'http://localhost:5173/orders',
    });

    expect(cognitoOAuth.exchangeCode).toHaveBeenCalledWith('code', 'expected-nonce');
    expect(cognitoUsers.syncUser).toHaveBeenCalledWith(profile);
    expect(authSessions.createSession).toHaveBeenCalledWith('user-id', 'refresh-token');
  });

  it('stops the callback before token exchange when Cognito reports an OAuth error', async () => {
    oauthTransactions.consume.mockResolvedValue({
      nonce: 'nonce',
      returnTo: 'http://localhost:5173/',
    });

    await expect(service.completeLogin(undefined, 'state', 'access_denied')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(cognitoOAuth.exchangeCode).not.toHaveBeenCalled();
    expect(authSessions.createSession).not.toHaveBeenCalled();
  });
});
