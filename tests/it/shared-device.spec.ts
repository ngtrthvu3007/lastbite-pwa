import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, getSession, listSessions, seedSession } from '../support/db';
import { attachJson } from '../support/evidence';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const seededUsers: string[] = [];

async function seed(expiresInMs: number) {
  const seeded = await seedSession(expiresInMs);
  seededUsers.push(seeded.userId);

  return seeded;
}

const emailOf = (body: unknown) => (body as { email?: string }).email;

test.afterEach(async () => {
  await Promise.all(seededUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

// Two people share one device, so the same API serves both of them one after the other.
test.describe('two users on one device', () => {
  test('[LB-96] each session answers with its own user', async ({ playwright }) => {
    const alice = await seed(3 * DAY_MS);
    const bob = await seed(3 * DAY_MS);

    const [forAlice, forBob] = await Promise.all([
      callApi(playwright, 'GET', '/auth/me', alice.token),
      callApi(playwright, 'GET', '/auth/me', bob.token),
    ]);

    await attachJson('identities', { alice: emailOf(forAlice.body), bob: emailOf(forBob.body) });

    expect(emailOf(forAlice.body)).toBe(alice.email);
    expect(emailOf(forBob.body)).toBe(bob.email);
    expect(alice.email).not.toBe(bob.email);
  });

  test('[LB-96] logging out one user leaves the other user signed in', async ({ playwright }) => {
    const alice = await seed(3 * DAY_MS);
    const bob = await seed(3 * DAY_MS);

    await callApi(playwright, 'POST', '/auth/logout', alice.token);

    const aliceAfter = await callApi(playwright, 'GET', '/auth/me', alice.token);
    const bobAfter = await callApi(playwright, 'GET', '/auth/me', bob.token);

    await attachJson('after alice logs out', {
      alice: aliceAfter.status,
      bob: bobAfter.status,
      aliceRevoked: Boolean((await getSession(alice.token))?.revoked_at),
      bobRevoked: Boolean((await getSession(bob.token))?.revoked_at),
    });

    expect(aliceAfter.status).toBe(401);
    expect(bobAfter.status).toBe(200);
    expect((await getSession(alice.token))?.revoked_at).not.toBeNull();
    expect((await getSession(bob.token))?.revoked_at).toBeNull();
  });

  test('[LB-95] rotating one user session does not touch the other user', async ({ playwright }) => {
    const alice = await seed(HOUR_MS);
    const bob = await seed(HOUR_MS);

    const aliceRotated = await callApi(playwright, 'GET', '/auth/me', alice.token);
    const bobSessions = await listSessions(bob.userId);

    await attachJson('rotation', {
      aliceGotNewCookie: Boolean(aliceRotated.cookies[SESSION_COOKIE]),
      bobSessionRows: bobSessions.length,
    });

    expect(aliceRotated.cookies[SESSION_COOKIE]).toBeDefined();
    expect(bobSessions).toHaveLength(1);
    expect(bobSessions[0].expires_at.getTime()).toBeLessThan(Date.now() + 2 * HOUR_MS);
  });
});
