export const HTTPStatus = {
  UNAUTHORIZED: 401,
} as const;

// Sends lb_session on every call to the API host.
export const API_CREDENTIALS = "include";

export const API_PATH = {
  AUTH_ME: "/auth/me",
  AUTH_LOGIN: "/auth/login",
} as const;
