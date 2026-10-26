// Hint cookie set by the API next to the HttpOnly lb_session; not proof of a session.
export const SIGNED_IN_COOKIE = "lb_signed_in";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

// File name of middleware/auth.ts; a page lists it in definePageMeta to require a signed-in user.
export const AUTH_MIDDLEWARE = "auth";

// Error code the GraphQL API returns for a missing or expired session.
export const GRAPHQL_UNAUTHENTICATED = "UNAUTHENTICATED";

// One leading "/" and nothing that browsers read as another host: no "//" or "/\" start
// (they treat "\" as "/", so "/\evil.com" acts like "//evil.com") and no backslash anywhere.
export const SAME_SITE_PATH_PATTERN = /^\/(?![/\\])[^\\]*$/;
