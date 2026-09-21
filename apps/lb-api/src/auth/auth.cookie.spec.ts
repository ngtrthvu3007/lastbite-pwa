import { Response } from 'express';
import { AUTH_COOKIE_NAME, setSessionCookie } from './auth.cookie';

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
});
