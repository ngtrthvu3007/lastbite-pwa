import type { NuxtApp } from "#app";
import { API_PATH, HTTPStatus } from "~/constants/http";
import type { AuthUser } from "~/types/auth";

export const getAuthMe = async (api: NuxtApp["$api"]) => {
  const { data, error } = await api.get<AuthUser>(API_PATH.AUTH_ME, { expectUnauthorized: true });
  // 401 means nobody is signed in, not an error.
  if (error?.status === HTTPStatus.UNAUTHORIZED) return { data: null, error: null };

  return { data, error };
};
