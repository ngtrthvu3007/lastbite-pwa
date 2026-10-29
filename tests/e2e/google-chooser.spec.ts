import { expect, test } from '@playwright/test';

test.describe('Google sign-in', () => {
  // Talks to Cognito and Google, so it needs the internet. Skip it with --grep-invert @external.
  test('[LB-98] @external Continue with Google reaches Google with the account chooser requested', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /google/i }).click();

    // Not waiting for "load": Google's sign-in page is heavy, and the URL is all this test needs.
    await page.waitForURL(/accounts\.google\.com/, { waitUntil: 'commit', timeout: 20_000 });

    // This browser has no Google session, so Google shows its sign-in page. The request for the
    // account chooser is what can be checked here.
    expect(new URL(page.url()).searchParams.get('prompt')).toBe('select_account');
  });
});
