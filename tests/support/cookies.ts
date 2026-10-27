import type { APIResponse } from '@playwright/test';

export const SESSION_COOKIE = 'lb_session';
export const HINT_COOKIE = 'lb_signed_in';

// A hint cookie for a browser context. Add it before the first page load of a test.
export const buildHintCookie = (url: string) => ({ name: HINT_COOKIE, value: '1', url });

// The Cookie header the API reads the session from.
export const buildSessionHeader = (token: string) => ({ cookie: `${SESSION_COOKIE}=${token}` });

export interface SetCookie {
  value: string;
  httpOnly: boolean;
  secure: boolean;
  path?: string;
  domain?: string;
  sameSite?: string;
  maxAge?: number;
  expires?: Date;
}

// Reads every Set-Cookie header of a response into a map keyed by cookie name.
export function parseSetCookies(response: APIResponse): Record<string, SetCookie> {
  const cookies: Record<string, SetCookie> = {};

  for (const { name, value: header } of response.headersArray()) {
    if (name.toLowerCase() !== 'set-cookie') continue;

    const [pair, ...attributes] = header.split(';').map((part) => part.trim());
    const separator = pair.indexOf('=');
    const cookie: SetCookie = { value: pair.slice(separator + 1), httpOnly: false, secure: false };

    for (const attribute of attributes) {
      const [key, ...rest] = attribute.split('=');
      const text = rest.join('=');

      switch (key.toLowerCase()) {
        case 'httponly':
          cookie.httpOnly = true;
          break;
        case 'secure':
          cookie.secure = true;
          break;
        case 'path':
          cookie.path = text;
          break;
        case 'domain':
          cookie.domain = text;
          break;
        case 'samesite':
          cookie.sameSite = text.toLowerCase();
          break;
        case 'max-age':
          cookie.maxAge = Number(text);
          break;
        case 'expires':
          cookie.expires = new Date(text);
          break;
      }
    }

    cookies[pair.slice(0, separator)] = cookie;
  }

  return cookies;
}
