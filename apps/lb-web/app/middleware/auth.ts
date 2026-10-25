import { ROUTE } from '~/constants/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, waitForUser } = useAuth()

  await waitForUser()

  if (!user.value) return navigateTo({ path: ROUTE.LOGIN, query: { redirect: to.fullPath } })
})
