import { expect, test } from '@playwright/test';
import { env } from '../support/env';
import { attachJson } from '../support/evidence';
import { callCallback, expectNoSession, readBodyText, startLogin } from '../support/oauth';

// /auth/callback needs a code from Google, so a full login cannot run here. What can run: every way
// the callback can be refused. Each one must leave no cookie, no redirect and no session behind.
test.describe('GET /auth/callback refusals', () => {
  test('[LB-89] a state that was never issued is rejected', async ({ request }) => {
    const response = await callCallback(request, { code: 'any-code', state: 'never-issued' });

    await attachJson('response', { status: response.status(), body: await response.json() });

    expect(response.status()).toBe(400);
    expectNoSession(response);
  });

  test('[LB-89] a callback without state, or with an empty state, is rejected', async ({ request }) => {
    for (const query of ['code=any-code', 'code=any-code&state=']) {
      const response = await request.get(`/auth/callback?${query}`, { maxRedirects: 0 });

      expect(response.status(), query).toBe(400);
      expectNoSession(response);
    }
  });

  test('[LB-89] a valid state without a code or an error is rejected', async ({ request }) => {
    const { state } = await startLogin(request);

    const response = await callCallback(request, { state });

    // Swagger documents 401 for a missing code; the DTO answers 400 first. Either is a refusal.
    await attachJson('response', { status: response.status(), body: await response.json() });

    expect([400, 401]).toContain(response.status());
    expectNoSession(response);
  });

  test('[LB-89] the user denying access (error=access_denied) is rejected without a session', async ({
    request,
  }) => {
    const { state } = await startLogin(request);

    const response = await callCallback(request, { state, error: 'access_denied' });

    expect(response.status()).toBe(400);
    expect(await readBodyText(response)).toMatch(/access_denied/);
    expectNoSession(response);
  });

  test('[LB-89] a state works once: after a refusal the same state is already consumed', async ({
    request,
  }) => {
    const { state } = await startLogin(request);

    const first = await callCallback(request, { state, error: 'access_denied' });
    const replay = await callCallback(request, { state, error: 'access_denied' });

    await attachJson('replay', { first: await first.json(), replay: await replay.json() });

    expect(await readBodyText(first)).toMatch(/OAuth login failed/);
    expect(replay.status()).toBe(400);
    expect(await readBodyText(replay)).toMatch(/state/i);
    expectNoSession(replay);
  });

  test('[LB-89] a stolen callback state is single-use even with a different error', async ({ request }) => {
    const { state } = await startLogin(request);

    await callCallback(request, { state, error: 'server_error' });
    const replay = await callCallback(request, { state, error: 'access_denied' });

    expect(await readBodyText(replay)).toMatch(/state/i);
  });

  test('[LB-89] the error text is returned as JSON, never as HTML', async ({ request }) => {
    const { state } = await startLogin(request);

    const response = await callCallback(request, { state, error: '<script>alert(1)</script>' });

    await attachJson('headers', response.headers());

    expect(response.headers()['content-type']).toMatch(/application\/json/);
  });

  test('[LB-89] @external Cognito refusing a bad code leaves no session and burns the state', async ({
    request,
  }) => {
    const { state } = await startLogin(request);

    const first = await callCallback(request, { state, code: 'not-a-real-code' });
    const replay = await callCallback(request, { state, code: 'not-a-real-code' });

    // The status is attached, not asserted: the code comes from the browser URL, so a bad one is the
    // caller's mistake, yet the API currently answers 502 (bad gateway). Worth a decision.
    await attachJson('bad code', {
      first: { status: first.status(), body: await first.json() },
      replay: { status: replay.status(), body: await replay.json() },
    });

    expectNoSession(first);
    expect(replay.status()).toBe(400);
    expect(await readBodyText(replay)).toMatch(/state/i);
  });

  // FINDING (beyond the Jira text, OWASP "login CSRF"): the state lives only in Redis and is not tied
  // to the browser that started the login. An attacker can start a login, sign in with their own
  // Google account, and hand the resulting /auth/callback?code&state link to a victim; the victim's
  // browser then gets a session for the attacker's account. A cookie set at /auth/login and checked at
  // /auth/callback closes this. The test compares how the API treats the same state from the browser
  // that started it and from a different one.
  test('[LB-89] @finding a callback from a browser that did not start the login is treated differently', async ({
    playwright,
  }) => {
    const starter = await playwright.request.newContext({ baseURL: env.apiUrl });
    const stranger = await playwright.request.newContext({ baseURL: env.apiUrl });

    try {
      const own = await startLogin(starter);
      const fromStarter = await callCallback(starter, { state: own.state, error: 'access_denied' });

      const other = await startLogin(starter);
      const fromStranger = await callCallback(stranger, { state: other.state, error: 'access_denied' });

      await attachJson('same state, two browsers', {
        starter: await fromStarter.json(),
        stranger: await fromStranger.json(),
      });

      expect(await readBodyText(fromStranger)).not.toBe(await readBodyText(fromStarter));
    } finally {
      await starter.dispose();
      await stranger.dispose();
    }
  });
});
