// HTTP and the API.
export const HTTPStatus = {
  UNAUTHORIZED: 401,
} as const;

// Sends lb_session on every call to the API host.
export const API_CREDENTIALS = "include";

export const API_PATH = {
  AUTH_ME: "/auth/me",
  AUTH_LOGIN: "/auth/login",
} as const;

// Hint cookie set by the API next to the HttpOnly lb_session; not proof of a session.
export const SIGNED_IN_COOKIE = "lb_signed_in";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

// Error code the GraphQL API returns for a missing or expired session.
export const GRAPHQL_UNAUTHENTICATED = "UNAUTHENTICATED";

// i18n.
export const LOCALE_STATE_KEY = "locale";

// Every regular expression of the app in one place, so what each one accepts is easy to review.
// Keys are global (/g) only where they are used with replace, never with test.
export const PATTERN = {
  // {name} in a message; names are letters, digits and underscore only.
  I18N_PLACEHOLDER: /\{(\w+)\}/g,

  // One leading "/" and nothing that browsers read as another host: no "//" or "/\" start
  // (they treat "\" as "/", so "/\evil.com" acts like "//evil.com") and no backslash anywhere.
  SAME_SITE_PATH: /^\/(?![/\\])[^\\]*$/,

  // What a user may type inside a phone number (0901 234.567-8).
  PHONE_SEPARATOR: /[\s.-]/g,

  // The 84 / +84 country code, replaced by the local prefix so the API gets 0xxxxxxxxx.
  PHONE_COUNTRY_CODE: /^\+?84/,

  // Local mobile number: 0, then 3[2-9], 5[25689], 7[06-9], 8[1-9] or 9x, then 7 digits. Same rule as the API.
  PHONE_MOBILE: /^0(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d)\d{7}$/,
} as const;
