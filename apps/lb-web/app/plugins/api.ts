import { API_CREDENTIALS, HTTPMethod, HTTPStatus } from "~/constants/http";

type Body = Record<string, unknown> | FormData;

export default defineNuxtPlugin(() => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const { handleUnauthorized } = useAuth();

  const request = $fetch.create({
    baseURL: apiBaseUrl,
    credentials: API_CREDENTIALS,
    onResponseError({ response }) {
      if (response.status === HTTPStatus.UNAUTHORIZED) handleUnauthorized();
    },
  });

  const api = {
    get: <T>(url: string, query?: Record<string, unknown>) => request<T>(url, { query }),
    post: <T>(url: string, body?: Body) => request<T>(url, { method: HTTPMethod.POST, body }),
    put: <T>(url: string, body?: Body) => request<T>(url, { method: HTTPMethod.PUT, body }),
    patch: <T>(url: string, body?: Body) => request<T>(url, { method: HTTPMethod.PATCH, body }),
    delete: <T>(url: string) => request<T>(url, { method: HTTPMethod.DELETE }),
    // Escape hatch for the status code and headers, e.g. useAuth reads a 401 without redirecting.
    raw: request.raw,
  };

  return { provide: { api } };
});
