import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AuthController } from '../src/auth/auth.controller';
import { AuthSessionService } from '../src/auth/auth-session.service';
import { CognitoOAuthService } from '../src/auth/cognito-oauth.service';
import { CognitoUserService } from '../src/auth/cognito-user.service';
import { OAuthTransactionService } from '../src/auth/oauth-transaction.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const oauthTransactions = {
    begin: jest.fn(),
    consume: jest.fn(),
  };
  const cognitoOAuth = {
    exchangeCode: jest.fn(),
  };
  const cognitoUsers = {
    syncUser: jest.fn(),
  };
  const authSessions = {
    createSession: jest.fn(),
  };

  beforeAll(async () => {
    process.env.APP_ENV = 'test';

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: OAuthTransactionService, useValue: oauthTransactions },
        { provide: CognitoOAuthService, useValue: cognitoOAuth },
        { provide: CognitoUserService, useValue: cognitoUsers },
        { provide: AuthSessionService, useValue: authSessions },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /auth/login redirects to the Cognito authorize URL', async () => {
    oauthTransactions.begin.mockResolvedValue(
      'https://auth.example.com/oauth2/authorize?identity_provider=Google',
    );

    await request(app.getHttpServer())
      .get('/auth/login')
      .query({
        app: 'customer',
        provider: 'google',
        returnTo: 'http://localhost:5173/orders',
      })
      .expect(302)
      .expect(
        'Location',
        'https://auth.example.com/oauth2/authorize?identity_provider=Google',
      );

    expect(oauthTransactions.begin).toHaveBeenCalledWith(
      'customer',
      'google',
      'http://localhost:5173/orders',
    );
  });

  it('GET /auth/callback creates a LastBite session and redirects to the app', async () => {
    const expiresAt = new Date('2030-01-08T00:00:00.000Z');
    const profile = {
      cognitoSub: 'cognito-sub',
      email: 'customer@example.com',
      displayName: 'Customer',
      avatarUrl: null,
    };

    oauthTransactions.consume.mockResolvedValue({
      nonce: 'expected-nonce',
      returnTo: 'http://localhost:5173/orders',
    });
    cognitoOAuth.exchangeCode.mockResolvedValue({
      profile,
      refreshToken: 'cognito-refresh-token',
    });
    cognitoUsers.syncUser.mockResolvedValue('user-id');
    authSessions.createSession.mockResolvedValue({
      token: 'lastbite-session-token',
      expiresAt,
    });

    const response = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ code: 'authorization-code', state: 'oauth-state' })
      .expect(302)
      .expect('Location', 'http://localhost:5173/orders');

    expect(response.headers['set-cookie']?.[0]).toContain(
      'lb_session=lastbite-session-token',
    );
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(cognitoOAuth.exchangeCode).toHaveBeenCalledWith(
      'authorization-code',
      'expected-nonce',
    );
    expect(cognitoUsers.syncUser).toHaveBeenCalledWith(profile);
    expect(authSessions.createSession).toHaveBeenCalledWith(
      'user-id',
      'cognito-refresh-token',
    );
  });

  it('does not create a session when the OAuth state is invalid', async () => {
    oauthTransactions.consume.mockRejectedValue(
      new BadRequestException('OAuth state is invalid or expired'),
    );

    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ code: 'authorization-code', state: 'invalid-state' })
      .expect(400);

    expect(cognitoOAuth.exchangeCode).not.toHaveBeenCalled();
    expect(cognitoUsers.syncUser).not.toHaveBeenCalled();
    expect(authSessions.createSession).not.toHaveBeenCalled();
  });

  it('does not create a session when Cognito returns an OAuth error', async () => {
    oauthTransactions.consume.mockResolvedValue({
      nonce: 'expected-nonce',
      returnTo: 'http://localhost:5173/',
    });

    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ error: 'access_denied', state: 'oauth-state' })
      .expect(400);

    expect(cognitoOAuth.exchangeCode).not.toHaveBeenCalled();
    expect(cognitoUsers.syncUser).not.toHaveBeenCalled();
    expect(authSessions.createSession).not.toHaveBeenCalled();
  });
});
