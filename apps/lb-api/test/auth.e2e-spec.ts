import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const auth = {
    beginLoginService: jest.fn(),
    completeLoginService: jest.fn(),
    getCurrentUserService: jest.fn(),
    logoutService: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }, AuthGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /auth/login redirects to the Cognito authorize URL', async () => {
    auth.beginLoginService.mockResolvedValue(
      'https://auth.example.com/oauth2/authorize?identity_provider=Google',
    );

    await request(app.getHttpServer())
      .get('/auth/login')
      .query({
        returnTo: 'http://localhost:5173/orders',
      })
      .expect(302)
      .expect('Location', 'https://auth.example.com/oauth2/authorize?identity_provider=Google');

    expect(auth.beginLoginService).toHaveBeenCalledWith('http://localhost:5173/orders');
  });

  it('GET /auth/login allows an omitted returnTo', async () => {
    auth.beginLoginService.mockResolvedValue('https://auth.example.com/oauth2/authorize');

    await request(app.getHttpServer()).get('/auth/login').expect(302);

    expect(auth.beginLoginService).toHaveBeenCalledWith(undefined);
  });

  it('GET /auth/login rejects an invalid returnTo type', async () => {
    await request(app.getHttpServer())
      .get('/auth/login')
      .query({ returnTo: ['a', 'b'] })
      .expect(400);

    expect(auth.beginLoginService).not.toHaveBeenCalled();
  });

  it('GET /auth/callback creates a LastBite session and redirects to the app', async () => {
    const expiresAt = new Date('2030-01-08T00:00:00.000Z');
    auth.completeLoginService.mockResolvedValue({
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
    expect(auth.completeLoginService).toHaveBeenCalledWith(
      'authorization-code',
      'oauth-state',
      undefined,
    );
  });

  it('does not create a session when Cognito returns an OAuth error', async () => {
    auth.completeLoginService.mockRejectedValue(
      new BadRequestException('OAuth login failed: access_denied'),
    );

    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ error: 'access_denied', state: 'oauth-state' })
      .expect(400);

    expect(auth.completeLoginService).toHaveBeenCalledWith(
      undefined,
      'oauth-state',
      'access_denied',
    );
  });

  it('rejects a callback that has neither code nor error', async () => {
    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ state: 'oauth-state' })
      .expect(400);

    expect(auth.completeLoginService).not.toHaveBeenCalled();
  });

  it('rejects a callback without state', async () => {
    await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ code: 'authorization-code' })
      .expect(400);

    expect(auth.completeLoginService).not.toHaveBeenCalled();
  });

  it('GET /auth/me rejects a request without a session cookie', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    expect(auth.getCurrentUserService).not.toHaveBeenCalled();
  });

  it('GET /auth/me returns the authenticated user from the session cookie', async () => {
    const user = {
      id: 'user-id',
      email: 'customer@example.com',
      displayName: 'Customer',
      avatarUrl: null,
    };
    auth.getCurrentUserService.mockResolvedValue(user);

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

    expect(auth.getCurrentUserService).toHaveBeenCalledWith('opaque-token');
  });

  it('GET /auth/me rejects a session the service no longer accepts', async () => {
    auth.getCurrentUserService.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=expired-token')
      .expect(401);
  });

  it('POST /auth/logout revokes the session and clears the cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(204);

    expect(auth.logoutService).toHaveBeenCalledWith('opaque-token');
    expect(response.headers['set-cookie']?.[0]).toMatch(/^lb_session=;/);
  });

  it('POST /auth/logout without a session cookie revokes nothing', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(204);

    expect(auth.logoutService).not.toHaveBeenCalled();
  });
});
