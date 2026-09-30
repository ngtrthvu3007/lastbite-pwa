import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'lb_session';

function sessionCookieOptions(appEnv: string | undefined): CookieOptions {
  return {
    httpOnly: true,
    secure: appEnv === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
  appEnv: string | undefined = process.env.APP_ENV,
): void {
  const options: CookieOptions = { ...sessionCookieOptions(appEnv), expires: expiresAt };

  response.cookie(AUTH_COOKIE_NAME, token, options);
}

export function clearSessionCookie(
  response: Response,
  appEnv: string | undefined = process.env.APP_ENV,
): void {
  response.clearCookie(AUTH_COOKIE_NAME, sessionCookieOptions(appEnv));
}

export function getSessionToken(cookieHeader: string | undefined): string | undefined {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}
