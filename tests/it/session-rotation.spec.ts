import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { HINT_COOKIE, SESSION_COOKIE } from '../support/cookies';
import {
  closeDb,
  deleteUser,
  expireSession,
  getSession,
  listSessions,
  revokeSession,
  seedSession,
} from '../support/db';
import { attachJson } from '../support/evidence';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const GRACE_MS = 2 * MINUTE_MS;
const SLACK_MS = 1000;

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

test.describe('session rotation in AuthGuard', () => {
  test('[LB-95] a session with under 2 hours left is rotated: new cookies, new row, old row shortened', async ({
    playwright,
  }) => {
    const { userId, token } = await seed(HOUR_MS);
    const before = Date.now();

    const response = await callApi(playwright, 'GET', '/auth/me', token);

    const after = Date.now();
    const sessions = await listSessions(userId);
    const old = await getSession(token);

    await attachJson('rotation', {
      status: response.status,
      setCookies: Object.keys(response.cookies),
      sessions: sessions.map((row) => ({ expiresAt: row.expires_at, revokedAt: row.revoked_at })),
    });

    expect(response.status).toBe(200);
    expect(response.cookies[SESSION_COOKIE]?.value).toBeTruthy();
    expect(response.cookies[SESSION_COOKIE].value).not.toBe(token);
    expect(response.cookies[HINT_COOKIE]?.value).toBe('1');
    expect(sessions).toHaveLength(2);
    // The old session is shortened to the grace period, not revoked.
    expect(old?.revoked_at).toBeNull();
    expect(old!.expires_at.getTime()).toBeGreaterThanOrEqual(before + GRACE_MS - SLACK_MS);
    expect(old!.expires_at.getTime()).toBeLessThanOrEqual(after + GRACE_MS + SLACK_MS);
  });

  test('[LB-95] the new session works, lasts 7 days and is not rotated again', async ({ playwright }) => {
    const { token } = await seed(HOUR_MS);
    const rotated = await callApi(playwright, 'GET', '/auth/me', token);
    const newToken = rotated.cookies[SESSION_COOKIE].value;

    const next = await callApi(playwright, 'GET', '/auth/me', newToken);
    const row = await getSession(newToken);
    const left = row!.expires_at.getTime() - Date.now();

    await attachJson('new session', { status: next.status, msLeft: left, setCookies: Object.keys(next.cookies) });

    expect(next.status).toBe(200);
    expect(next.cookies[SESSION_COOKIE]).toBeUndefined();
    expect(left).toBeGreaterThan(7 * DAY_MS - MINUTE_MS);
    expect(left).toBeLessThanOrEqual(7 * DAY_MS);
  });

  test('[LB-95] the old session still works during the grace period and is not rotated again', async ({
    playwright,
  }) => {
    const { userId, token } = await seed(HOUR_MS);
    await callApi(playwright, 'GET', '/auth/me', token);

    const again = await callApi(playwright, 'GET', '/auth/me', token);

    await attachJson('old token in grace', { status: again.status, setCookies: Object.keys(again.cookies) });

    expect(again.status).toBe(200);
    expect(again.cookies[SESSION_COOKIE]).toBeUndefined();
    expect(await listSessions(userId)).toHaveLength(2);
  });

  test('[LB-95] after the grace period the old session is rejected', async ({ playwright }) => {
    const { token } = await seed(HOUR_MS);
    await callApi(playwright, 'GET', '/auth/me', token);
    await expireSession(token);

    const response = await callApi(playwright, 'GET', '/auth/me', token);

    await attachJson('old token after grace', { status: response.status });

    expect(response.status).toBe(401);
  });

  test('[LB-95] parallel requests with one old token create exactly one new session', async ({ playwright }) => {
    const { userId, token } = await seed(HOUR_MS);

    const responses = await Promise.all(
      Array.from({ length: 6 }, () => callApi(playwright, 'GET', '/auth/me', token)),
    );
    const sessions = await listSessions(userId);

    await attachJson('parallel', {
      statuses: responses.map((response) => response.status),
      withNewCookie: responses.filter((response) => response.cookies[SESSION_COOKIE]).length,
      sessionRows: sessions.length,
    });

    // No request is thrown out while the old token is in its grace period.
    expect(responses.map((response) => response.status)).toEqual(Array(6).fill(200));
    // The conditional UPDATE lets one request win. A second row would be the known narrow race.
    expect(sessions).toHaveLength(2);
    expect(responses.filter((response) => response.cookies[SESSION_COOKIE])).toHaveLength(1);
  });

  test('[LB-95] a session with 3 hours left is not rotated', async ({ playwright }) => {
    const { userId, token } = await seed(3 * HOUR_MS);

    const response = await callApi(playwright, 'GET', '/auth/me', token);

    await attachJson('3 hours left', { status: response.status, setCookies: Object.keys(response.cookies) });

    expect(response.status).toBe(200);
    expect(response.cookies[SESSION_COOKIE]).toBeUndefined();
    expect(await listSessions(userId)).toHaveLength(1);
  });

  test('[LB-95] an expired session is rejected and not rotated', async ({ playwright }) => {
    const { userId, token } = await seed(-HOUR_MS);

    const response = await callApi(playwright, 'GET', '/auth/me', token);

    await attachJson('expired', { status: response.status, setCookies: Object.keys(response.cookies) });

    expect(response.status).toBe(401);
    expect(response.cookies[SESSION_COOKIE]).toBeUndefined();
    expect(await listSessions(userId)).toHaveLength(1);
  });

  test('[LB-95] a revoked session is rejected and not rotated', async ({ playwright }) => {
    const { userId, token } = await seed(HOUR_MS);
    await revokeSession(token);

    const response = await callApi(playwright, 'GET', '/auth/me', token);

    await attachJson('revoked', { status: response.status, setCookies: Object.keys(response.cookies) });

    expect(response.status).toBe(401);
    expect(response.cookies[SESSION_COOKIE]).toBeUndefined();
    expect(await listSessions(userId)).toHaveLength(1);
  });
});
