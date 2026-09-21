import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'lb_session';

export function setSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
  appEnv: string | undefined = process.env.APP_ENV,
): void {
  const options: CookieOptions = {
    httpOnly: true,
    secure: appEnv === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };

  response.cookie(AUTH_COOKIE_NAME, token, options);
}
