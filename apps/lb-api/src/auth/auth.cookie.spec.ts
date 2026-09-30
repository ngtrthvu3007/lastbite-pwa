import { Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from './auth.cookie';

describe('setSessionCookie', () => {
  it('uses the production cookie security settings', () => {
    const cookie = jest.fn();
    const response = { cookie } as unknown as Response;
    const expiresAt = new Date('2026-09-28T00:00:00.000Z');

    setSessionCookie(response, 'opaque-token', expiresAt, 'production');

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

    clearSessionCookie(response, 'production');

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
