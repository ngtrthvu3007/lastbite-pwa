export const ROUTE = {
  HOME: "/",
  LOGIN: "/login",
  MERCHANT: "/merchant",
  MERCHANT_STORE: "/merchant/store",
  MERCHANT_STORE_NEW: "/merchant/store/new",
  MERCHANT_POST_NEW: "/merchant/posts/new",
} as const;

// File name of a layouts/ file; a page lists it in definePageMeta.
export const LAYOUT = {
  MERCHANT: "merchant",
} as const;

// File name of middleware/auth.ts; a page lists it in definePageMeta to require a signed-in user.
export const AUTH_MIDDLEWARE = "auth";
