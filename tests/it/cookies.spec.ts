import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { HINT_COOKIE, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, getSession, seedSession } from '../support/db';
import { env } from '../support/env';
import { attachJson } from '../support/evidence';

const HOUR_MS = 60 * 60 * 1000;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

const seededUsers: string[] = [];

async function seed(expiresInMs: number) {
  const seeded = await seedSession(expiresInMs);
  seededUsers.push(seeded.userId);

  return seeded;
}

test.afterEach(async () => {
  await Promise.all(seededUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

test.describe('session and hint cookies', () => {
  test('[LB-96] a rotation sets lb_session (HttpOnly) and the lb_signed_in hint (readable) for 7 days', async ({
    playwright,
  }) => {
    const { token } = await seed(HOUR_MS);

    const { cookies, headers } = await callApi(playwright, 'GET', '/auth/me', token);
    const session = cookies[SESSION_COOKIE];
    const hint = cookies[HINT_COOKIE];

    await attachJson('cookies', { session, hint, cacheControl: headers['cache-control'] });

    expect(session.httpOnly).toBe(true);
    expect(session.sameSite).toBe('lax');
    expect(session.path).toBe('/');
    expect(session.expires!.getTime()).toBeGreaterThan(Date.now() + (WEEK_SECONDS - 60) * 1000);

    expect(hint.value).toBe('1');
    expect(hint.httpOnly).toBe(false);
    expect(hint.sameSite).toBe('lax');
    expect(hint.path).toBe('/');
    expect(hint.secure).toBe(session.secure);
    expect(hint.maxAge).toBeGreaterThan(WEEK_SECONDS - 60);
    expect(hint.maxAge).toBeLessThanOrEqual(WEEK_SECONDS);
    // Without COOKIE_DOMAIN the hint is host-only, with it the hint carries that Domain.
    if (env.cookieDomain) expect(hint.domain).toContain(env.cookieDomain.replace(/^\./, ''));
    else expect(hint.domain).toBeUndefined();
  });

  test('[LB-96] /auth/me is never cached, also when it rotates the session', async ({ playwright }) => {
    const { token } = await seed(HOUR_MS);

    const { headers } = await callApi(playwright, 'GET', '/auth/me', token);

    expect(headers['cache-control']).toBe('no-store');
  });

  test('[LB-96] logout revokes the session and clears both cookies', async ({ playwright }) => {
    const { token } = await seed(3 * 24 * HOUR_MS);

    const logout = await callApi(playwright, 'POST', '/auth/logout', token);
    const row = await getSession(token);
    const afterwards = await callApi(playwright, 'GET', '/auth/me', token);

    await attachJson('logout', {
      status: logout.status,
      cleared: Object.keys(logout.cookies),
      revokedAt: row?.revoked_at,
      meAfterLogout: afterwards.status,
    });

    expect(logout.status).toBe(204);
    for (const name of [SESSION_COOKIE, HINT_COOKIE]) {
      expect(logout.cookies[name]?.value).toBe('');
      expect(logout.cookies[name].expires!.getTime()).toBeLessThan(Date.now());
    }
    expect(row?.revoked_at).not.toBeNull();
    expect(afterwards.status).toBe(401);
  });
});
