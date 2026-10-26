import { API_CREDENTIALS, HTTPStatus } from "~/constants/http";

type ApiError = Error & { status?: number };
type Options = {
  query?: Record<string, unknown>;
  // A 401 is an expected answer (the session check): do not sign the user out.
  expectUnauthorized?: boolean;
};

export default defineNuxtPlugin(() => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const { handleUnauthorized } = useAuth();

  const request = $fetch.create({ baseURL: apiBaseUrl, credentials: API_CREDENTIALS });

  // Never throws: returns { data, error }.
  const get = async <T>(url: string, { expectUnauthorized, query }: Options = {}) => {
    try {
      return { data: await request<T>(url, { query }), error: null };
    } catch (caught) {
      const error = caught as ApiError;

      if (error.status === HTTPStatus.UNAUTHORIZED && !expectUnauthorized) handleUnauthorized();

      return { data: null, error };
    }
  };

  return { provide: { api: { get } } };
});
