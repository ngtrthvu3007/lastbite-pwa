import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { parseSetCookies } from './cookies';
import { env } from './env';

// Starts a login the way the web app does and reads the state and nonce out of the Cognito URL.
export async function startLogin(api: APIRequestContext, returnTo = `${env.webUrl}/`) {
  const response = await api.get('/auth/login', { params: { returnTo }, maxRedirects: 0 });
  const authorize = new URL(response.headers()['location']);

  return {
    state: authorize.searchParams.get('state')!,
    nonce: authorize.searchParams.get('nonce')!,
    authorize,
  };
}

export const callCallback = (api: APIRequestContext, params: Record<string, string>) =>
  api.get('/auth/callback', { params, maxRedirects: 0 });

// A failed login must not leave anything behind: no cookie, no redirect to the app.
export function expectNoSession(response: APIResponse) {
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.headers()['location']).toBeUndefined();
  expect(Object.keys(parseSetCookies(response))).toEqual([]);
}

export const readBodyText = async (response: APIResponse) => JSON.stringify(await response.json());
