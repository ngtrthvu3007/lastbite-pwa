import { BadRequestException, INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AuthService } from '../src/auth/auth.service';

const inHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const auth = {
    beginLoginService: jest.fn(),
    completeLoginService: jest.fn(),
    getActiveSessionService: jest.fn(),
    rotateSessionService: jest.fn().mockResolvedValue(null),
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

    const [session, hint] = response.headers['set-cookie'] ?? [];
    expect(session).toContain('lb_session=lastbite-session-token');
    expect(session).toContain('HttpOnly');
    expect(hint).toContain('lb_signed_in=1');
    expect(hint).toContain('Max-Age=');
    expect(hint).not.toContain('HttpOnly');
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

    expect(auth.getActiveSessionService).not.toHaveBeenCalled();
  });

  it('GET /auth/me returns the authenticated user from the session cookie', async () => {
    const user = {
      id: 'user-id',
      email: 'customer@example.com',
      displayName: 'Customer',
      avatarUrl: null,
    };
    auth.getActiveSessionService.mockResolvedValue({ user, expiresAt: inHours(48) });

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

    expect(auth.getActiveSessionService).toHaveBeenCalledWith('opaque-token');
  });

  it('GET /auth/me does not rotate a session that is not close to expiry', async () => {
    auth.getActiveSessionService.mockResolvedValue({
      user: { id: 'user-id' },
      expiresAt: inHours(3),
    });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(200)
      .expect('Cache-Control', 'no-store');

    expect(auth.rotateSessionService).not.toHaveBeenCalled();
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('GET /auth/me sends a new session cookie when the session was rotated', async () => {
    auth.getActiveSessionService.mockResolvedValue({
      user: { id: 'user-id' },
      expiresAt: inHours(1),
    });
    auth.rotateSessionService.mockResolvedValueOnce({
      token: 'rotated-token',
      expiresAt: new Date('2030-01-08T00:00:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(200);

    expect(auth.rotateSessionService).toHaveBeenCalledWith('opaque-token');
    expect(response.headers['set-cookie']?.[0]).toContain('lb_session=rotated-token');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(response.headers['set-cookie']?.[1]).toContain('lb_signed_in=1');
  });

  it('GET /auth/me sends no cookie when another request already rotated the session', async () => {
    auth.getActiveSessionService.mockResolvedValue({
      user: { id: 'user-id' },
      expiresAt: inHours(1),
    });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(200);

    expect(auth.rotateSessionService).toHaveBeenCalledWith('opaque-token');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('GET /auth/me still succeeds when rotating the session fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    auth.getActiveSessionService.mockResolvedValue({
      user: { id: 'user-id' },
      expiresAt: inHours(1),
    });
    auth.rotateSessionService.mockRejectedValueOnce(new Error('db down'));

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(200);

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Session rotation failed', expect.any(Error));
    warn.mockRestore();
  });

  it('GET /auth/me rejects a session the service no longer accepts, without rotating it', async () => {
    auth.getActiveSessionService.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'lb_session=expired-token')
      .expect(401);

    expect(auth.rotateSessionService).not.toHaveBeenCalled();
  });

  it('POST /auth/logout revokes the session and clears the cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', 'lb_session=opaque-token')
      .expect(204);

    expect(auth.logoutService).toHaveBeenCalledWith('opaque-token');
    expect(response.headers['set-cookie']?.[0]).toMatch(/^lb_session=;/);
    expect(response.headers['set-cookie']?.[1]).toMatch(/^lb_signed_in=;/);
  });

  it('POST /auth/logout without a session cookie revokes nothing', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(204);

    expect(auth.logoutService).not.toHaveBeenCalled();
  });
});
