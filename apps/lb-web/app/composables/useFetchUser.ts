import type { NuxtApp } from "#app";
import { useQuery } from "@tanstack/vue-query";
import { getAuthMe } from "~/api/auth";
import { AUTH_ME_QUERY_KEY } from "~/constants/auth";

// Also used by the plugin and middleware, which have no component to hold a subscription.
export const buildUserQuery = (api: NuxtApp["$api"]) => ({
  queryKey: AUTH_ME_QUERY_KEY,
  // The answer is kept until a 401 elsewhere clears it.
  staleTime: Infinity,
  queryFn: async () => {
    const { data, error } = await getAuthMe(api);
    if (error) throw error;
    return data;
  },
});

export const useFetchUser = () => {
  const { $api } = useNuxtApp();
  const { hasSignedInHint } = useAuth();

  return useQuery({
    ...buildUserQuery($api),
    enabled: computed(hasSignedInHint),
    retry: false,
  });
};
