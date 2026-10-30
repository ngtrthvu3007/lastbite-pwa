import { expect, test } from '@playwright/test';
import { SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, seedSession } from '../support/db';
import { env } from '../support/env';
import { attachJson } from '../support/evidence';

const DAY_MS = 24 * 60 * 60 * 1000;

const seededUsers: string[] = [];

async function seed(expiresInMs = 3 * DAY_MS) {
  const seeded = await seedSession(expiresInMs);
  seededUsers.push(seeded.userId);

  return seeded;
}

test.afterEach(async () => {
  await Promise.all(seededUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

test.describe('what /auth/me returns', () => {
  test('[LB-85] the body is the public user and nothing else', async ({ request }) => {
    const { userId, email, token } = await seed();

    const response = await request.get('/auth/me', { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
    const body = await response.json();

    await attachJson('body', body);

    expect(response.status()).toBe(200);
    // Nullable fields are present as null, so the web app can rely on the shape.
    expect(Object.keys(body).sort()).toEqual(['avatarUrl', 'displayName', 'email', 'id']);
    expect(body).toMatchObject({ id: userId, email, displayName: 'IT user', avatarUrl: null });
    expect(JSON.stringify(body)).not.toContain(token);
  });

  test('[LB-96][LB-101] a refused request is not cacheable either', async ({ request }) => {
    // LB-96: "/auth/me has Cache-Control: no-store". The handler's @Header does not apply to a 401
    // thrown by the guard, so the guard sets the header itself (LB-101).
    const response = await request.get('/auth/me');

    await attachJson('headers', response.headers());

    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toBe('no-store');
  });
});

test.describe('only the lb_session cookie authenticates', () => {
  test('[LB-85] the token in a header or in the URL is not accepted', async ({ request }) => {
    const { token } = await seed();
    const attempts: Array<[string, Record<string, string>, string]> = [
      ['Authorization bearer', { authorization: `Bearer ${token}` }, '/auth/me'],
      ['Authorization raw', { authorization: token }, '/auth/me'],
      ['x-lb-session header', { 'x-lb-session': token }, '/auth/me'],
      ['query string', {}, `/auth/me?lb_session=${token}`],
    ];

    for (const [name, headers, path] of attempts) {
      const response = await request.get(path, { headers });

      expect(response.status(), name).toBe(401);
    }
  });

  test('[LB-85] the Cookie header is read by exact cookie name', async ({ request }) => {
    const { token } = await seed();
    const cases: Array<[string, string, number]> = [
      ['plain', `lb_session=${token}`, 200],
      ['after another cookie, no space', `a=1;lb_session=${token}`, 200],
      ['between other cookies', `a=1; lb_session=${token}; b=2`, 200],
      ['name with a prefix', `x_lb_session=${token}`, 401],
      ['name with a suffix', `lb_session_old=${token}`, 401],
      ['name in another case', `LB_SESSION=${token}`, 401],
      ['empty value', 'lb_session=', 401],
      ['token with one extra character', `lb_session=${token}x`, 401],
      ['token cut short', `lb_session=${token.slice(0, -1)}`, 401],
    ];

    for (const [name, cookie, status] of cases) {
      const response = await request.get('/auth/me', { headers: { cookie } });

      expect(response.status(), name).toBe(status);
    }
  });
});

test.describe('routes and methods', () => {
  test('[LB-85] logout is POST only: a GET cannot sign the user out', async ({ request }) => {
    const { token } = await seed();
    const headers = { cookie: `${SESSION_COOKIE}=${token}` };

    const logoutByGet = await request.get('/auth/logout', { headers });
    const afterwards = await request.get('/auth/me', { headers });

    expect(logoutByGet.status()).toBe(404);
    expect(afterwards.status()).toBe(200);
  });

  test('[LB-85] only the documented method answers on each auth route', async ({ request }) => {
    const wrong: Array<['GET' | 'POST', string]> = [
      ['POST', '/auth/me'],
      ['POST', '/auth/login'],
      ['POST', '/auth/callback'],
    ];

    for (const [method, path] of wrong) {
      const response = await request.fetch(path, { method, maxRedirects: 0 });

      expect(response.status(), `${method} ${path}`).toBe(404);
    }
  });
});

test.describe('CORS for the web app', () => {
  test('[LB-86] the preflight for a credentialed POST /auth/logout passes for the web origin', async ({
    request,
  }) => {
    const origin = new URL(env.webUrl).origin;

    const response = await request.fetch('/auth/logout', {
      method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': 'POST' },
    });

    await attachJson('preflight', { status: response.status(), headers: response.headers() });

    expect(response.status()).toBeLessThan(300);
    expect(response.headers()['access-control-allow-origin']).toBe(origin);
    expect(response.headers()['access-control-allow-credentials']).toBe('true');
    expect(response.headers()['access-control-allow-methods']).toContain('POST');
  });
});
