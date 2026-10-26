import { Response } from 'express';
import { clearSessionCookie, getSessionToken, setSessionCookie } from './auth.cookie';
import { AUTH_COOKIE_NAME, SIGNED_IN_COOKIE_NAME } from '../auth.constants';

describe('session cookie', () => {
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

  it('allows the cookie over plain HTTP outside production', () => {
    process.env.APP_ENV = 'development';
    const cookie = jest.fn();

    setSessionCookie({ cookie } as unknown as Response, 'opaque-token', new Date());

    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'opaque-token',
      expect.objectContaining({ httpOnly: true, secure: false }),
    );
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

  describe('lb_signed_in hint cookie', () => {
    const originalDomain = process.env.COOKIE_DOMAIN;

    afterEach(() => {
      jest.useRealTimers();
      if (originalDomain === undefined) delete process.env.COOKIE_DOMAIN;
      else process.env.COOKIE_DOMAIN = originalDomain;
    });

    it('is readable by the web app and lasts as long as the session', () => {
      jest.useFakeTimers().setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
      delete process.env.COOKIE_DOMAIN;
      const cookie = jest.fn();

      setSessionCookie(
        { cookie } as unknown as Response,
        'opaque-token',
        new Date('2030-01-08T00:00:00.000Z'),
      );

      expect(cookie).toHaveBeenCalledWith(SIGNED_IN_COOKIE_NAME, '1', {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

    it('uses COOKIE_DOMAIN when set, and clears with the same options', () => {
      process.env.COOKIE_DOMAIN = 'example.com';
      const cookie = jest.fn();
      const clearCookie = jest.fn();
      const response = { cookie, clearCookie } as unknown as Response;

      setSessionCookie(response, 'opaque-token', new Date(Date.now() + 1000));
      clearSessionCookie(response);

      expect(cookie).toHaveBeenCalledWith(
        SIGNED_IN_COOKIE_NAME,
        '1',
        expect.objectContaining({ domain: 'example.com', httpOnly: false }),
      );
      expect(clearCookie).toHaveBeenCalledWith(SIGNED_IN_COOKIE_NAME, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
        domain: 'example.com',
      });
    });
  });

  it.each(['theme=light; lb_session=opaque-token', 'x_lb_session=wrong; lb_session=opaque-token'])(
    'reads only the LastBite session token from %p',
    (header) => {
      expect(getSessionToken(header)).toBe('opaque-token');
    },
  );

  it.each([undefined, 'theme=light', 'x_lb_session=wrong'])(
    'returns nothing when the header is %p',
    (header) => {
      expect(getSessionToken(header)).toBeUndefined();
    },
  );
});
