import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

const RETURN_TO = 'http://localhost:5173/orders';
const CODE = 'code';
const STATE = 'state';
const NONCE = 'expected-nonce';
const OAUTH_ERROR = 'access_denied';
const SESSION_TOKEN = 'opaque-token';
const REFRESH_TOKEN = 'refresh-token';
const USER_ID = 'user-id';
const EXPIRES_AT = new Date('2030-01-08T00:00:00.000Z');
const PROFILE = {
  cognitoSub: 'cognito-sub',
  email: 'customer@example.com',
  displayName: 'Customer',
  avatarUrl: null,
};

describe('AuthService.completeLoginService', () => {
  let oauthTransactions: { consumeTransactionService: jest.Mock };
  let cognitoOAuth: { exchangeCodeService: jest.Mock };
  let cognitoUsers: { syncUserService: jest.Mock };
  let authSessions: { createSessionService: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    oauthTransactions = { consumeTransactionService: jest.fn() };
    cognitoOAuth = { exchangeCodeService: jest.fn() };
    cognitoUsers = { syncUserService: jest.fn() };
    authSessions = { createSessionService: jest.fn() };
    service = new AuthService(
      oauthTransactions as never,
      cognitoOAuth as never,
      cognitoUsers as never,
      authSessions as never,
    );
    oauthTransactions.consumeTransactionService.mockResolvedValue({
      nonce: NONCE,
      returnTo: RETURN_TO,
    });
  });

  it('turns a successful OAuth callback into a LastBite session', async () => {
    cognitoOAuth.exchangeCodeService.mockResolvedValue({
      profile: PROFILE,
      refreshToken: REFRESH_TOKEN,
    });
    cognitoUsers.syncUserService.mockResolvedValue(USER_ID);
    authSessions.createSessionService.mockResolvedValue({
      token: SESSION_TOKEN,
      expiresAt: EXPIRES_AT,
    });

    await expect(service.completeLoginService(CODE, STATE, undefined)).resolves.toEqual({
      token: SESSION_TOKEN,
      expiresAt: EXPIRES_AT,
      returnTo: RETURN_TO,
    });

    expect(oauthTransactions.consumeTransactionService).toHaveBeenCalledWith(STATE);
    expect(cognitoOAuth.exchangeCodeService).toHaveBeenCalledWith(CODE, NONCE);
    expect(cognitoUsers.syncUserService).toHaveBeenCalledWith(PROFILE);
    expect(authSessions.createSessionService).toHaveBeenCalledWith(USER_ID, REFRESH_TOKEN);
  });

  it('consumes the state and fails without exchanging a token when Cognito reports an error', async () => {
    await expect(
      service.completeLoginService(undefined, STATE, OAUTH_ERROR),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(oauthTransactions.consumeTransactionService).toHaveBeenCalledWith(STATE);
    expect(cognitoOAuth.exchangeCodeService).not.toHaveBeenCalled();
    expect(authSessions.createSessionService).not.toHaveBeenCalled();
  });
});
