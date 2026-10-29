import type { PlaywrightWorkerArgs } from '@playwright/test';
import { buildSessionHeader, parseSetCookies, type SetCookie } from './cookies';
import { env } from './env';

export interface ApiResult {
  status: number;
  headers: Record<string, string>;
  cookies: Record<string, SetCookie>;
  body: unknown;
}

// One call with its own cookie jar. A shared jar would add the cookies the API just set to the next
// call, which hides what the test sent. Redirects are not followed, so a 302 can be inspected.
export async function callApi(
  playwright: PlaywrightWorkerArgs['playwright'],
  method: 'GET' | 'POST',
  path: string,
  token?: string,
): Promise<ApiResult> {
  const context = await playwright.request.newContext({ baseURL: env.apiUrl });

  try {
    const response = await context.fetch(path, {
      method,
      headers: token ? buildSessionHeader(token) : {},
      maxRedirects: 0,
    });
    const text = await response.text();

    return {
      status: response.status(),
      headers: response.headers(),
      cookies: parseSetCookies(response),
      body: parseBody(text),
    };
  } finally {
    await context.dispose();
  }
}

function parseBody(text: string): unknown {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
