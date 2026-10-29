import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { env } from '../support/env';
import { attachJson } from '../support/evidence';

const LOGIN_PATH = `/auth/login?returnTo=${encodeURIComponent(`${env.webUrl}/`)}`;

test.describe('Google sign-in redirect', () => {
  test('[LB-98] /auth/login sends the browser to Cognito for Google and asks for the account chooser', async ({
    playwright,
  }) => {
    const { status, headers } = await callApi(playwright, 'GET', LOGIN_PATH);
    const location = new URL(headers['location']);

    await attachJson('authorize url', {
      status,
      host: location.host,
      params: Object.fromEntries(location.searchParams),
    });

    expect(status).toBe(302);
    expect(location.host).toMatch(/amazoncognito\.com$/);
    expect(location.searchParams.get('identity_provider')).toBe('Google');
    expect(location.searchParams.get('response_type')).toBe('code');
    expect(location.searchParams.get('state')).toBeTruthy();
    expect(location.searchParams.get('nonce')).toBeTruthy();
    expect(location.searchParams.get('prompt')).toBe('select_account');
  });

  test('[LB-98] @external Cognito managed login passes prompt=select_account on to Google', async ({
    playwright,
  }) => {
    // The prompt is added here, not taken from the API, so this checks Cognito's setup (managed
    // login) on its own, whether or not the API already sends the prompt.
    const { headers } = await callApi(playwright, 'GET', LOGIN_PATH);
    const authorizeUrl = new URL(headers['location']);
    authorizeUrl.searchParams.set('prompt', 'select_account');
    const cognito = await playwright.request.newContext();

    try {
      const response = await cognito.get(authorizeUrl.toString(), { maxRedirects: 0 });
      const google = new URL(response.headers()['location']);

      await attachJson('cognito to google', {
        status: response.status(),
        host: google.host,
        prompt: google.searchParams.get('prompt'),
      });

      expect(response.status()).toBe(302);
      expect(google.host).toBe('accounts.google.com');
      expect(google.searchParams.get('prompt')).toBe('select_account');
    } finally {
      await cognito.dispose();
    }
  });
});
