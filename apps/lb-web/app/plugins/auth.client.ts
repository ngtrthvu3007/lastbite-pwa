// Client-only: the lb_session cookie belongs to the API host, so the Nuxt server never sees it.
export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['query'],
  setup(nuxtApp) {
    const { hasSignedInHint } = useAuth()

    if (hasSignedInHint()) void nuxtApp.$queryClient.prefetchQuery(buildUserQuery(nuxtApp.$api))
  },
})
