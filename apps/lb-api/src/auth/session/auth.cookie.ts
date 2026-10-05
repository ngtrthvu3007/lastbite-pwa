import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'lb_session';

function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.APP_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date): void {
  response.cookie(AUTH_COOKIE_NAME, token, { ...getSessionCookieOptions(), expires: expiresAt });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(AUTH_COOKIE_NAME, getSessionCookieOptions());
}

export function getSessionToken(cookieHeader: string | undefined): string | undefined {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}
