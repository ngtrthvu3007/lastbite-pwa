import { expect, test, type Page } from '@playwright/test';
import { buildHintCookie } from '../support/cookies';

// Collects Vue hydration warnings. A mismatch between the server HTML and the first client render
// is not patched in production, so the page can end up with a stuck disabled button.
const watchHydration = (page: Page) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/Hydration/.test(message.text())) warnings.push(message.text().slice(0, 120));
  });

  return warnings;
};

test.describe('hint cookie without a valid session', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([buildHintCookie(baseURL!)]);
  });

  test('[LB-97] opening the app asks /auth/me exactly once', async ({ page }) => {
    const authMeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/auth/me')) authMeRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(authMeRequests).toHaveLength(1);
  });

  test('[LB-97] a dead session: the public page stays, /merchant goes to login and stays there', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/merchant');
    await expect(page).toHaveURL(/\/login\?redirect=\/merchant$/);
    await page.waitForLoadState('networkidle');

    // No redirect loop: the URL is still the login page a moment later.
    await expect(page).toHaveURL(/\/login\?redirect=\/merchant$/);
    await expect(page.getByRole('button', { name: /google/i })).toBeEnabled();
  });

  test('[LB-97] with the API down /merchant shows the error page, and retry works once it is back', async ({
    page,
  }) => {
    await page.route('**/auth/me', (route) => route.abort());

    await page.goto('/merchant');
    await expect(page.getByText('Có lỗi xảy ra')).toBeVisible();
    await expect(page).toHaveURL(/\/merchant$/);

    await page.unroute('**/auth/me');
    await page.getByRole('button', { name: 'Thử lại' }).click();

    await expect(page).toHaveURL(/\/login\?redirect=\/merchant$/);
  });

  test('[LB-97] a 500 from /auth/me shows the error page, not login', async ({ page }) => {
    await page.route('**/auth/me', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/merchant');

    await expect(page.getByText('Có lỗi xảy ra')).toBeVisible();
    await expect(page).toHaveURL(/\/merchant$/);
  });

  test('[LB-97] the login page with the API down shows the error, keeps Google usable, and retry clears it', async ({
    page,
  }) => {
    const hydrationWarnings = watchHydration(page);
    await page.route('**/auth/me', (route) => route.abort());

    await page.goto('/login');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: /thử lại/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeEnabled();

    await page.unroute('**/auth/me');
    await page.getByRole('button', { name: /thử lại/i }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(hydrationWarnings).toEqual([]);
  });

  test('[LB-97] the login page hydrates cleanly while the session check is still running', async ({ page }) => {
    const hydrationWarnings = watchHydration(page);
    await page.route('**/auth/me', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /google/i })).toBeEnabled();
    expect(hydrationWarnings).toEqual([]);
  });
});
