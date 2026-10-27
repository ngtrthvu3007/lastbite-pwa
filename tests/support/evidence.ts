import { test } from '@playwright/test';

// Puts a JSON block into the test's section of results/report.md.
export const attachJson = (name: string, data: unknown) =>
  test.info().attach(name, { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
