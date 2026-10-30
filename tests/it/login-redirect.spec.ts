import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { env } from '../support/env';
import { attachJson } from '../support/evidence';
import { startLogin } from '../support/oauth';

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

  const webHost = new URL(env.webUrl).host;
  const rejectedReturnTos = {
    'another site': 'https://evil.example/',
    'protocol-relative URL': '//evil.example/',
    'credentials in the URL': `${new URL(env.webUrl).protocol}//user:pass@${webHost}/`,
  };

  for (const [name, returnTo] of Object.entries(rejectedReturnTos)) {
    test(`[LB-88] /auth/login rejects a returnTo with ${name}`, async ({ request }) => {
      const response = await request.get(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`, {
        maxRedirects: 0,
      });

      await attachJson('response', {
        returnTo,
        status: response.status(),
        location: response.headers()['location'] ?? null,
      });

      expect(response.status()).toBe(400);
      expect(response.headers()['location']).toBeUndefined();
    });
  }

  // Looks like the web origin to a quick check, but is not.
  const web = new URL(env.webUrl);
  const lookalikeReturnTos = {
    'a sub-domain-style suffix': `${web.protocol}//${web.hostname}.evil.example${web.port ? `:${web.port}` : ''}/`,
    'the web host as user info': `${web.protocol}//${web.host}@evil.example/`,
    'another port': `${web.protocol}//${web.hostname}:${web.port ? Number(web.port) + 1 : 8081}/`,
    'the other scheme': `${web.protocol === 'http:' ? 'https:' : 'http:'}//${web.host}/`,
    'a javascript: URL': 'javascript:alert(1)',
    'a data: URL': 'data:text/html,x',
    'a backslash host': '/\\evil.example',
    'a tab inside the slashes': '/\t/evil.example',
    'the web URL only in the query': 'https://evil.example/?next=' + env.webUrl,
  };

  for (const [name, returnTo] of Object.entries(lookalikeReturnTos)) {
    test(`[LB-89] /auth/login rejects a returnTo with ${name}`, async ({ request }) => {
      const response = await request.get('/auth/login', { params: { returnTo }, maxRedirects: 0 });

      await attachJson('response', { returnTo, status: response.status() });

      expect(response.status()).toBe(400);
      expect(response.headers()['location']).toBeUndefined();
    });
  }

  // LB-99: new URL() throws on these; the API used to answer 500 instead of 400.
  const unparsableReturnTos = {
    'an empty host': 'http://',
    'only two slashes': '//',
    'a broken IPv6 host': 'http://[',
    'a space in the host': 'http://exa mple.com/',
    'a port out of range': 'http://localhost:99999/',
  };

  for (const [name, returnTo] of Object.entries(unparsableReturnTos)) {
    test(`[LB-89][LB-99] /auth/login answers 400, not 500, for a returnTo with ${name}`, async ({
      request,
    }) => {
      const response = await request.get('/auth/login', { params: { returnTo }, maxRedirects: 0 });

      await attachJson('response', { returnTo, status: response.status() });

      expect(response.status()).toBe(400);
      expect(response.headers()['location']).toBeUndefined();
    });
  }

  test('[LB-89] /auth/login rejects a returnTo sent twice', async ({ request }) => {
    const response = await request.get('/auth/login?returnTo=/a&returnTo=/b', { maxRedirects: 0 });

    expect(response.status()).toBe(400);
    expect(response.headers()['location']).toBeUndefined();
  });

  const acceptedReturnTos = {
    'no returnTo': undefined,
    'a relative path': '/merchant',
    'a path with query and fragment': '/merchant?tab=1#top',
    'the full web URL': `${env.webUrl}/merchant`,
  };

  for (const [name, returnTo] of Object.entries(acceptedReturnTos)) {
    test(`[LB-89] /auth/login accepts ${name}`, async ({ request }) => {
      const response = await request.get('/auth/login', {
        params: returnTo === undefined ? {} : { returnTo },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(302);
      expect(new URL(response.headers()['location']).host).toMatch(/amazoncognito\.com$/);
    });
  }

  test('[LB-89] the authorize URL ignores everything the client tries to set', async ({ request }) => {
    const response = await request.get('/auth/login', {
      params: {
        returnTo: `${env.webUrl}/`,
        state: 'attacker-state',
        nonce: 'attacker-nonce',
        prompt: 'none',
        identity_provider: 'Facebook',
        provider: 'Facebook',
        redirect_uri: 'https://evil.example/cb',
        client_id: 'evil',
        scope: 'admin',
        response_type: 'token',
        app: 'merchant',
        role: 'admin',
      },
      maxRedirects: 0,
    });
    const params = new URL(response.headers()['location']).searchParams;

    await attachJson('authorize params', Object.fromEntries(params));

    expect(response.status()).toBe(302);
    expect(params.get('state')).not.toBe('attacker-state');
    expect(params.get('nonce')).not.toBe('attacker-nonce');
    expect(params.get('prompt')).toBe('select_account');
    expect(params.get('identity_provider')).toBe('Google');
    expect(params.get('response_type')).toBe('code');
    expect(params.get('client_id')).not.toBe('evil');
    expect(new URL(params.get('redirect_uri')!).pathname).toBe('/auth/callback');
    expect(params.get('scope')!.split(' ')).toEqual(expect.arrayContaining(['openid', 'email', 'profile']));
    expect(params.get('scope')).not.toContain('admin');
    for (const name of ['app', 'role', 'provider', 'returnTo']) expect(params.has(name)).toBe(false);
  });

  test('[LB-89] every login gets its own unguessable state and nonce', async ({ request }) => {
    const first = await startLogin(request);
    const second = await startLogin(request);

    await attachJson('lengths', { state: first.state.length, nonce: first.nonce.length });

    expect(second.state).not.toBe(first.state);
    expect(second.nonce).not.toBe(first.nonce);
    expect(first.state).not.toBe(first.nonce);
    // 32 random bytes in base64url are 43 characters; anything under 32 is under 24 bytes.
    for (const value of [first.state, first.nonce]) expect(value.length).toBeGreaterThanOrEqual(32);
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
