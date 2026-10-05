import { Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from './auth.cookie';

describe('setSessionCookie', () => {
  const originalAppEnv = process.env.APP_ENV;

  beforeEach(() => {
    process.env.APP_ENV = 'production';
  });

  afterEach(() => {
    if (originalAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalAppEnv;
  });

  it('uses the production cookie security settings', () => {
    const cookie = jest.fn();
    const response = { cookie } as unknown as Response;
    const expiresAt = new Date('2026-09-28T00:00:00.000Z');

    setSessionCookie(response, 'opaque-token', expiresAt);

    expect(cookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, 'opaque-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  });

  it('clears the session cookie with the same security options', () => {
    const clearCookie = jest.fn();
    const response = { clearCookie } as unknown as Response;

    clearSessionCookie(response);

    expect(clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('reads only the LastBite session token from a Cookie header', () => {
    expect(getSessionToken('theme=light; lb_session=opaque-token')).toBe('opaque-token');
  });
});
