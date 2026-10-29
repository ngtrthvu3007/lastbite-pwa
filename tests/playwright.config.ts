import { defineConfig, devices } from '@playwright/test';
import { env } from './support/env';

export default defineConfig({
  // Tests share one database and one API, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }], ['./reporters/markdown-reporter.ts']],
  use: { screenshot: 'on', trace: 'retain-on-failure' },
  projects: [
    // Integration tests: HTTP calls straight to the API, no browser.
    { name: 'it', testDir: './it', use: { baseURL: env.apiUrl } },
    // End-to-end tests: the web app on a phone-sized screen. The app is mobile-only for now.
    { name: 'e2e', testDir: './e2e', use: { ...devices['Pixel 7'], baseURL: env.webUrl } },
  ],
});
