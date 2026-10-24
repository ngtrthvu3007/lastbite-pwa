// Client-only: the lb_session cookie belongs to the API host, so the Nuxt server never sees it.
export default defineNuxtPlugin(() => {
  void useAuth().fetchUser()
})
