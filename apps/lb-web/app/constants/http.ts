export const HTTPMethod = {
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export const HTTPStatus = {
  UNAUTHORIZED: 401,
} as const;

// Send the lb_session cookie on every call to the API host.
export const API_CREDENTIALS = "include";

export const API_PATH = {
  AUTH_ME: "/auth/me",
  AUTH_LOGIN: "/auth/login",
} as const;
