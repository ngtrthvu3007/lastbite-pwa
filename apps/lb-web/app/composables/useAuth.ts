interface AuthUser {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
}

type AuthStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useAuth() {
  const { apiBaseUrl } = useRuntimeConfig().public
  const user = useState<AuthUser | null>('auth-user', () => null)
  const status = useState<AuthStatus>('auth-status', () => 'idle')

  // 401 means "not signed in", which is a normal answer; anything else is a real error.
  async function fetchUser() {
    status.value = 'loading'

    try {
      user.value = await $fetch<AuthUser>(`${apiBaseUrl}/auth/me`, { credentials: 'include' })
      status.value = 'ready'
    } catch (error) {
      const httpStatus = (error as { response?: { status?: number } }).response?.status

      user.value = null
      status.value = httpStatus === 401 ? 'ready' : 'error'
    }
  }

  // Full navigation, not fetch: Google needs the browser to follow the redirects itself.
  function loginWithGoogle(returnTo: string) {
    const query = new URLSearchParams({ returnTo })

    return navigateTo(`${apiBaseUrl}/auth/login?${query}`, { external: true })
  }

  return { user, status, fetchUser, loginWithGoogle }
}
