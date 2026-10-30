import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { HINT_COOKIE, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, getSession, seedSession } from '../support/db';
import { attachJson } from '../support/evidence';

const HOUR_MS = 60 * 60 * 1000;

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

test.describe('POST /auth/logout', () => {
  test('[LB-85] without any cookie it still answers 204 and clears both cookies', async ({ playwright }) => {
    const response = await callApi(playwright, 'POST', '/auth/logout');

    expect(response.status).toBe(204);
    for (const name of [SESSION_COOKIE, HINT_COOKIE]) expect(response.cookies[name]?.value).toBe('');
  });

  test('[LB-85] with a token nobody issued it answers 204 and clears both cookies', async ({ playwright }) => {
    const response = await callApi(playwright, 'POST', '/auth/logout', 'a-token-nobody-issued');

    expect(response.status).toBe(204);
    for (const name of [SESSION_COOKIE, HINT_COOKIE]) expect(response.cookies[name]?.value).toBe('');
  });

  test('[LB-85] logging out twice is safe and keeps the first revoked_at', async ({ playwright }) => {
    const { token } = await seed(3 * 24 * HOUR_MS);

    const first = await callApi(playwright, 'POST', '/auth/logout', token);
    const revokedAfterFirst = (await getSession(token))?.revoked_at;
    const second = await callApi(playwright, 'POST', '/auth/logout', token);
    const revokedAfterSecond = (await getSession(token))?.revoked_at;

    await attachJson('revoked_at', { revokedAfterFirst, revokedAfterSecond });

    expect([first.status, second.status]).toEqual([204, 204]);
    expect(revokedAfterFirst).not.toBeNull();
    expect(revokedAfterSecond?.getTime()).toBe(revokedAfterFirst?.getTime());
  });

  test('[LB-85] a revoked session is refused and is not renewed by the request', async ({ playwright }) => {
    // 1 hour left would rotate a live session; a revoked one must not.
    const { token } = await seed(HOUR_MS);

    await callApi(playwright, 'POST', '/auth/logout', token);
    const response = await callApi(playwright, 'GET', '/auth/me', token);

    expect(response.status).toBe(401);
    expect(response.cookies[SESSION_COOKIE]).toBeUndefined();
  });

  // LB-102: rotation keeps the old token alive for the 2-minute grace period. Logging out with the
  // NEW token must end it too, or a user who signs out on a shared device is not fully signed out.
  test('[LB-85][LB-102] logging out also ends the previous token still inside its grace period', async ({
    playwright,
  }) => {
    const { token: oldToken } = await seed(HOUR_MS);

    const rotation = await callApi(playwright, 'GET', '/auth/me', oldToken);
    const newToken = rotation.cookies[SESSION_COOKIE].value;

    await callApi(playwright, 'POST', '/auth/logout', newToken);

    const withNew = await callApi(playwright, 'GET', '/auth/me', newToken);
    const withOld = await callApi(playwright, 'GET', '/auth/me', oldToken);

    await attachJson('after logout', { withNew: withNew.status, withOld: withOld.status });

    expect(withNew.status).toBe(401);
    expect(withOld.status).toBe(401);
  });
});
