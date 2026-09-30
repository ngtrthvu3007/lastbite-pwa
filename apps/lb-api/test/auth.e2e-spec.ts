import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AuthController } from '../src/auth/auth.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AuthService } from '../src/auth/auth.service';
import { TEST_APP_ENV, useTestEnvironment } from '../src/test-support/test-environment';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let restoreEnvironment: () => void;

  const auth = {
    beginLogin: jest.fn(),
    completeLogin: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  };

  beforeAll(async () => {
    restoreEnvironment = useTestEnvironment(TEST_APP_ENV);

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }, AuthGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    restoreEnvironment();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /auth/login redirects to the Cognito authorize URL', async () => {
    auth.beginLogin.mockResolvedValue(
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
      .expect('Location', 'https://auth.example.com/oauth2/authorize?identity_provider=Google');

    expect(auth.beginLogin).toHaveBeenCalledWith(
      'customer',
      'google',
      'http://localhost:5173/orders',
    );
  });

  it('GET /auth/callback creates a LastBite session and redirects to the app', async () => {
    const expiresAt = new Date('2030-01-08T00:00:00.000Z');
    auth.completeLogin.mockResolvedValue({
      token: 'lastbite-session-token',
      expiresAt,
      returnTo: 'http://localhost:5173/orders',
    });

    const response = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ code: 'authorization-code', state: 'oauth-state' })
      .expect(302)
      .expect('Location', 'http://localhost:5173/orders');

    expect(response.headers['set-cookie']?.[0]).toContain('lb_session=lastbite-session-token');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(auth.completeLogin).toHaveBeenCalledWith('authorization-code', 'oauth-state', undefined);
  });

  it('does not create a session when the OAuth state is invalid', async () => {
    auth.completeLogin.mockRejectedValue(
      new BadRequestException('OAuth state is invalid or expired'),
    );

    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ code: 'authorization-code', state: 'invalid-state' })
      .expect(400);

    expect(auth.completeLogin).toHaveBeenCalledWith(
      'authorization-code',
      'invalid-state',
      undefined,
    );
  });

  it('does not create a session when Cognito returns an OAuth error', async () => {
    auth.completeLogin.mockRejectedValue(
      new BadRequestException('OAuth login failed: access_denied'),
    );

    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ error: 'access_denied', state: 'oauth-state' })
      .expect(400);

    expect(auth.completeLogin).toHaveBeenCalledWith(undefined, 'oauth-state', 'access_denied');
  });

  it('GET /auth/me returns the authenticated user from the session cookie', async () => {
    const user = {
      id: 'user-id',
      email: 'customer@example.com',
      displayName: 'Customer',
      avatarUrl: null,
      sessionId: 'internal-session-id',
    };
    auth.getCurrentUser.mockResolvedValue(user);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(200)
      .expect({
        id: 'user-id',
        email: 'customer@example.com',
        displayName: 'Customer',
        avatarUrl: null,
      });

    expect(auth.getCurrentUser).toHaveBeenCalledWith('opaque-token');
  });

  it('GET /auth/me rejects an expired or revoked session', async () => {
    auth.getCurrentUser.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=expired-token')
      .expect(401);
  });

  it('POST /auth/logout revokes the session and clears the cookie', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(204);

    expect(auth.logout).toHaveBeenCalledWith('opaque-token');
  });
});
