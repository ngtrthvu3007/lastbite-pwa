import { CookieOptions, Response } from 'express';
import { isProduction } from '../../common';
import { AUTH_COOKIE_NAME, SESSION_TOKEN_PATTERN, SIGNED_IN_COOKIE_NAME } from '../auth.constants';

function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
  };
}

// Readable by lb-web (not HttpOnly) so it can skip /auth/me for guests. It is a UI hint only:
// the guard still checks lb_session. COOKIE_DOMAIN is the parent domain shared with the web host.
function getSignedInCookieOptions(): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN?.trim();

  return { ...getSessionCookieOptions(), httpOnly: false, ...(domain && { domain }) };
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date): void {
  response.cookie(AUTH_COOKIE_NAME, token, { ...getSessionCookieOptions(), expires: expiresAt });
  // Max-Age, not Expires, so a wrong device clock cannot shift the hint away from the session.
  response.cookie(SIGNED_IN_COOKIE_NAME, '1', {
    ...getSignedInCookieOptions(),
    maxAge: expiresAt.getTime() - Date.now(),
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(AUTH_COOKIE_NAME, getSessionCookieOptions());
  response.clearCookie(SIGNED_IN_COOKIE_NAME, getSignedInCookieOptions());
}

export function getSessionToken(cookieHeader: string | undefined): string | undefined {
  return cookieHeader?.match(SESSION_TOKEN_PATTERN)?.[1];
}
