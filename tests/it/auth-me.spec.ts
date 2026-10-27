import { expect, test } from '@playwright/test';
import { SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, seedSession } from '../support/db';

const HOUR_MS = 60 * 60 * 1000;

test.afterAll(closeDb);

test.describe('GET /auth/me', () => {
  test('[LB-96] without a session cookie it answers 401', async ({ request }) => {
    const response = await request.get('/auth/me');

    await test.info().attach('response', {
      body: JSON.stringify({ status: response.status(), body: await response.json() }, null, 2),
      contentType: 'application/json',
    });

    expect(response.status()).toBe(401);
  });

  test('[LB-95][LB-96] a session with days left is not rotated, and the answer is not cached', async ({ request }) => {
    const { userId, token } = await seedSession(3 * 24 * HOUR_MS);

    try {
      const response = await request.get('/auth/me', {
        headers: { cookie: `${SESSION_COOKIE}=${token}` },
      });

      await test.info().attach('response', {
        body: JSON.stringify({ status: response.status(), headers: response.headers() }, null, 2),
        contentType: 'application/json',
      });

      expect(response.status()).toBe(200);
      expect(response.headers()['cache-control']).toBe('no-store');
      expect(response.headers()['set-cookie']).toBeUndefined();
    } finally {
      await deleteUser(userId);
    }
  });
});
