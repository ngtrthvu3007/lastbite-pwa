import { expect, test } from '@playwright/test';

test.describe('guest on a phone', () => {
  test('[LB-97] opening the app makes no /auth/me request', async ({ page }) => {
    const authMeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/auth/me')) authMeRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(authMeRequests).toHaveLength(0);
  });

  test('[LB-97] opening /merchant lands on the login page', async ({ page }) => {
    await page.goto('/merchant');

    await expect(page).toHaveURL(/\/login\?redirect=\/merchant$/);
    await expect(page.getByRole('button', { name: /google/i })).toBeEnabled();
  });
});
