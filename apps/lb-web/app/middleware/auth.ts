import { buildUserQuery } from "~/composables/useFetchUser";
import { ROUTE } from "~/constants/routes";

export default defineNuxtRouteMiddleware(async (to) => {
  const { $api, $queryClient } = useNuxtApp();
  const { hasSignedInHint } = useAuth();
  const toLogin = () => navigateTo({ path: ROUTE.LOGIN, query: { redirect: to.fullPath } });

  if (!hasSignedInHint()) return toLogin();

  // Joins the check the plugin started, and runs it again after a failure.
  const user = await $queryClient.fetchQuery(buildUserQuery($api)).catch(() => undefined);

  // A network or 5xx failure says nothing about the session.
  if (user === undefined) return abortNavigation(createError({ statusCode: 503 }));

  if (!user) return toLogin();
});
