import {
  AUTH_MIDDLEWARE,
  AUTH_STATUS_STATE_KEY,
  AUTH_USER_STATE_KEY,
  AuthStatus,
} from "~/constants/auth";
import { API_PATH, HTTPStatus } from "~/constants/http";
import { ROUTE } from "~/constants/routes";
import type { AuthUser } from "~/types/auth";

// Client-only (the session cookie is never sent to the Nuxt server), so one slot per browser tab.
let pendingUser: Promise<void> | null = null;

export const useAuth = () => {
  const nuxtApp = useNuxtApp();
  const { apiBaseUrl } = useRuntimeConfig().public;
  const user = useState<AuthUser | null>(AUTH_USER_STATE_KEY, () => null);
  const status = useState<AuthStatus>(AUTH_STATUS_STATE_KEY, () => AuthStatus.Idle);

  const requestUser = async () => {
    status.value = AuthStatus.Loading;

    try {
      // ignoreResponseError keeps the shared 401 redirect out of this call:
      // 401 here means "not signed in", which is a normal answer; anything else is a real error.
      const response = await nuxtApp.$api.raw<AuthUser>(API_PATH.AUTH_ME, {
        ignoreResponseError: true,
      });

      user.value = response.ok ? (response._data ?? null) : null;
      status.value =
        response.ok || response.status === HTTPStatus.UNAUTHORIZED
          ? AuthStatus.Ready
          : AuthStatus.Error;
    } catch {
      user.value = null;
      status.value = AuthStatus.Error;
    }
  };

  // Joins a check already in flight instead of starting a second one.
  const fetchUser = () => {
    if (import.meta.server) return Promise.resolve();

    pendingUser ??= requestUser().finally(() => {
      pendingUser = null;
    });

    return pendingUser;
  };

  // Lets route middleware wait for the session check that the auth plugin already started.
  const waitForUser = () => pendingUser ?? Promise.resolve();

  // Called from fetch/Apollo callbacks, outside any Nuxt context, hence runWithContext.
  // Public pages stay public: only a page that lists the auth middleware sends the user to login.
  const handleUnauthorized = () => {
    user.value = null;
    if (import.meta.server) return;

    return nuxtApp.runWithContext(() => {
      const { fullPath, meta } = useRoute();

      if ([meta.middleware].flat().includes(AUTH_MIDDLEWARE)) {
        return navigateTo({ path: ROUTE.LOGIN, query: { redirect: fullPath } });
      }
    });
  };

  // Full navigation, not fetch: Google needs the browser to follow the redirects itself.
  const loginWithGoogle = (returnTo: string) => {
    const query = new URLSearchParams({ returnTo });

    return navigateTo(`${apiBaseUrl}${API_PATH.AUTH_LOGIN}?${query}`, { external: true });
  };

  return { user, status, fetchUser, waitForUser, handleUnauthorized, loginWithGoogle };
};
