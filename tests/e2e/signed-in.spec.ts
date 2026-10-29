import { expect, test, type BrowserContext } from '@playwright/test';
import { buildHintCookie, HINT_COOKIE, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, listSessions, seedSession } from '../support/db';
import { env } from '../support/env';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

let seededUserId: string | undefined;

// Signs the browser in with a real session row, as if the Google flow had just finished. Cookies
// are shared by port on localhost, so the web app and the API at :3000 both see them.
async function signIn(context: BrowserContext, webUrl: string, expiresInMs: number) {
  const { userId, token } = await seedSession(expiresInMs);
  seededUserId = userId;

  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: webUrl, httpOnly: true },
    buildHintCookie(webUrl),
  ]);

  return { userId, token };
}

test.afterEach(async () => {
  if (seededUserId) await deleteUser(seededUserId);
  seededUserId = undefined;
});

test.afterAll(closeDb);

test.describe('signed-in user', () => {
  test('[LB-97] sees /merchant after exactly one /auth/me request', async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!, 3 * DAY_MS);
    const authMeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/auth/me')) authMeRequests.push(request.url());
    });

    await page.goto('/merchant');

    await expect(page.getByText('LastBite Merchant')).toBeVisible();
    await expect(page).toHaveURL(/\/merchant$/);
    expect(authMeRequests).toHaveLength(1);
  });

  test('[LB-97] opening /login is sent on to the redirect path, with no hydration warning', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!, 3 * DAY_MS);
    const hydrationWarnings: string[] = [];
    page.on('console', (message) => {
      if (/Hydration/.test(message.text())) hydrationWarnings.push(message.text().slice(0, 120));
    });

    await page.goto('/login?redirect=/merchant');

    await expect(page).toHaveURL(/\/merchant$/);
    expect(hydrationWarnings).toEqual([]);
  });

  test('[LB-95][LB-96] a session with under 2 hours left is rotated while /merchant opens', async ({
    page,
    context,
    baseURL,
  }) => {
    const { userId, token } = await signIn(context, baseURL!, HOUR_MS);

    await page.goto('/merchant');
    await expect(page.getByText('LastBite Merchant')).toBeVisible();

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE);
    const hint = cookies.find((cookie) => cookie.name === HINT_COOKIE);

    // The browser now holds the new session, still HttpOnly, and a hint that lasts 7 days again.
    expect(session?.value).toBeTruthy();
    expect(session?.value).not.toBe(token);
    expect(session?.httpOnly).toBe(true);
    expect(hint?.expires).toBeGreaterThan(Date.now() / 1000 + 7 * 24 * 3600 - 120);
    expect(await listSessions(userId)).toHaveLength(2);
  });

  test('[LB-96][LB-97] after the API logs the user out, /merchant goes to login and the cookies are gone', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!, 3 * DAY_MS);

    const logout = await context.request.post(`${env.apiUrl}/auth/logout`);
    expect(logout.status()).toBe(204);

    const names = (await context.cookies()).map((cookie) => cookie.name);
    expect(names).not.toContain(SESSION_COOKIE);
    expect(names).not.toContain(HINT_COOKIE);

    await page.goto('/merchant');
    await expect(page).toHaveURL(/\/login\?redirect=\/merchant$/);
  });
});
