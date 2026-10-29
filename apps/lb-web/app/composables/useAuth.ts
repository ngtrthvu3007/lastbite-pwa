import { AUTH_ME_QUERY_KEY, AUTH_MIDDLEWARE, SIGNED_IN_COOKIE } from "~/constants/auth";
import { API_PATH } from "~/constants/http";
import { ROUTE } from "~/constants/routes";

export const useAuth = () => {
  const nuxtApp = useNuxtApp();
  const { apiBaseUrl } = useRuntimeConfig().public;
  const signedInHint = useCookie(SIGNED_IN_COOKIE, { readonly: true });

  const hasSignedInHint = () => Boolean(signedInHint.value);

  // Runs from fetch/Apollo callbacks, outside the Nuxt context: hence runWithContext.
  // Only pages with the auth middleware go to login; public pages stay public.
  const handleUnauthorized = () => {
    if (import.meta.server) return;

    nuxtApp.$queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);

    return nuxtApp.runWithContext(() => {
      const { fullPath, meta } = useRoute();

      if ([meta.middleware].flat().includes(AUTH_MIDDLEWARE)) {
        return navigateTo({ path: ROUTE.LOGIN, query: { redirect: fullPath } });
      }
    });
  };

  // Full navigation, not fetch: Google's redirects need the browser.
  const loginWithGoogle = (returnTo: string) => {
    const query = new URLSearchParams({ returnTo });

    return navigateTo(`${apiBaseUrl}${API_PATH.AUTH_LOGIN}?${query}`, { external: true });
  };

  return { hasSignedInHint, handleUnauthorized, loginWithGoogle };
};
