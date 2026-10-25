export const AuthStatus = {
  Idle: "idle",
  Loading: "loading",
  Ready: "ready",
  Error: "error",
} as const;

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

export const AUTH_USER_STATE_KEY = "auth-user";
export const AUTH_STATUS_STATE_KEY = "auth-status";

// File name of middleware/auth.ts; a page lists it in definePageMeta to require a signed-in user.
export const AUTH_MIDDLEWARE = "auth";

// Error code the GraphQL API returns for a missing or expired session.
export const GRAPHQL_UNAUTHENTICATED = "UNAUTHENTICATED";

// One leading "/" and nothing that browsers read as another host: no "//" or "/\" start
// (they treat "\" as "/", so "/\evil.com" acts like "//evil.com") and no backslash anywhere.
export const SAME_SITE_PATH_PATTERN = /^\/(?![/\\])[^\\]*$/;
