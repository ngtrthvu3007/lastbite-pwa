import { expect, test, type BrowserContext } from '@playwright/test';
import { buildHintCookie, HINT_COOKIE, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, seedSession } from '../support/db';
import { env } from '../support/env';

const DAY_MS = 24 * 60 * 60 * 1000;

const seededUsers: string[] = [];

// Signs a user in the way the callback would: a session cookie plus the hint cookie.
async function signIn(context: BrowserContext, webUrl: string) {
  const seeded = await seedSession(3 * DAY_MS);
  seededUsers.push(seeded.userId);

  await context.addCookies([
    { name: SESSION_COOKIE, value: seeded.token, url: webUrl, httpOnly: true },
    buildHintCookie(webUrl),
  ]);

  return seeded;
}

async function whoAmI(context: BrowserContext) {
  const response = await context.request.get(`${env.apiUrl}/auth/me`);

  return { status: response.status(), email: response.ok() ? (await response.json()).email : undefined };
}

test.afterEach(async () => {
  await Promise.all(seededUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

test.describe('two users on one browser, one after the other', () => {
  test('[LB-96][LB-97][LB-98] user A signs out, user B signs in: B is B, and A is not let back in', async ({
    page,
    context,
    baseURL,
  }) => {
    const alice = await signIn(context, baseURL!);
    await page.goto('/merchant');
    await expect(page.getByText('LastBite Merchant')).toBeVisible();
    expect(await whoAmI(context)).toEqual({ status: 200, email: alice.email });

    // User A signs out: both cookies go, and a protected page sends the visitor to login.
    const logout = await context.request.post(`${env.apiUrl}/auth/logout`);
    expect(logout.status()).toBe(204);
    const afterLogout = (await context.cookies()).map((cookie) => cookie.name);
    expect(afterLogout).not.toContain(SESSION_COOKIE);
    expect(afterLogout).not.toContain(HINT_COOKIE);
    await page.goto('/merchant');
    await expect(page).toHaveURL(/\/login\?redirect=\/merchant$/);

    // User B signs in on the same browser.
    const bob = await signIn(context, baseURL!);
    await page.goto('/merchant');
    await expect(page.getByText('LastBite Merchant')).toBeVisible();
    expect(await whoAmI(context)).toEqual({ status: 200, email: bob.email });

    // The token user A had before signing out is dead.
    await context.clearCookies();
    await context.addCookies([{ name: SESSION_COOKIE, value: alice.token, url: baseURL!, httpOnly: true }]);
    expect((await whoAmI(context)).status).toBe(401);
  });

  test('[LB-96] two browsers at once each keep their own user', async ({ browser, baseURL }) => {
    const first = await browser.newContext({ baseURL });
    const second = await browser.newContext({ baseURL });

    try {
      const alice = await signIn(first, baseURL!);
      const bob = await signIn(second, baseURL!);

      expect(await whoAmI(first)).toEqual({ status: 200, email: alice.email });
      expect(await whoAmI(second)).toEqual({ status: 200, email: bob.email });
    } finally {
      await first.close();
      await second.close();
    }
  });
});
