<script setup lang="ts">
const { user, status, fetchUser, loginWithGoogle } = useAuth()
const route = useRoute()

const connecting = ref(false)
const { t } = useTranslate()

// Only same-site paths: the backend also rejects a returnTo outside APP_URL.
const redirectPath = computed(() => {
  const redirect = route.query.redirect

  // Browsers read "\" as "/", so "/\evil.com" would act like "//evil.com".
  return typeof redirect === 'string' && /^\/(?![/\\])/.test(redirect) && !redirect.includes('\\')
    ? redirect
    : '/'
})

watch(user, (current) => current && navigateTo(redirectPath.value), { immediate: true })

function startLogin() {
  connecting.value = true
  // Read at click time: the SSR request URL can be the internal host behind a proxy.
  loginWithGoogle(`${window.location.origin}${redirectPath.value}`)
}
</script>

<template>
  <main
    class="mx-auto flex min-h-screen max-w-md flex-col bg-[#FFFAF2] text-[#1F2933]">
    <div class="flex min-h-0 flex-1 flex-col gap-5 px-6 pt-10">
      <div class="flex items-center gap-2 text-[#2E7D32]">
        <svg width="44" height="44" viewBox="0 0 512 512" role="img" aria-label="LastBite" class="shrink-0">
          <defs>
            <linearGradient id="lb-logo-body" x1="96" y1="128" x2="416" y2="443" gradientUnits="userSpaceOnUse">
              <stop stop-color="#3B9146" />
              <stop offset="1" stop-color="#1B5E20" />
            </linearGradient>
            <linearGradient id="lb-logo-leaf" x1="255" y1="204" x2="346" y2="296" gradientUnits="userSpaceOnUse">
              <stop stop-color="#F7B23B" />
              <stop offset="1" stop-color="#EE8A2B" />
            </linearGradient>
            <mask id="lb-logo-bite">
              <rect width="512" height="512" fill="#fff" />
              <circle cx="405" cy="126" r="30" fill="#000" />
              <circle cx="425" cy="158" r="30" fill="#000" />
              <circle cx="441" cy="190" r="30" fill="#000" />
            </mask>
          </defs>
          <g mask="url(#lb-logo-bite)">
            <path fill="url(#lb-logo-body)"
              d="M105 155c8-17 25-27 44-27h214c19 0 36 10 44 27l50 107c5 11 7 23 4 35l-26 100c-7 27-31 46-59 46H136c-28 0-52-19-59-46L51 297c-3-12-1-24 4-35l50-107Z" />
            <path fill="url(#lb-logo-body)"
              d="M66 269h380c18 0 32 14 32 32v7c0 18-14 32-32 32H66c-18 0-32-14-32-32v-7c0-18 14-32 32-32Z" />
          </g>
          <path fill="#fff"
            d="M60 290c0-8 6-14 14-14h126c11 0 21 5 28 14l8 10 8-10c7-9 17-14 28-14h166c8 0 14 6 14 14s-6 14-14 14H272c-3 0-6 2-8 5l-17 21c-6 8-18 8-24 0l-17-21c-2-3-5-5-8-5H74c-8 0-14-6-14-14Z" />
          <path fill="url(#lb-logo-leaf)" d="M255 296c2-52 39-88 91-92 4 52-30 89-91 92Z" />
          <path fill="#fff" d="M263 285c20-22 42-39 67-53-19 17-35 36-49 58l-18-5Z" />
        </svg>
        <span class="text-[28px] leading-9 font-extrabold">LastBite</span>
      </div>

      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-[28px] leading-9 font-extrabold">
          {{ t('login.headline') }}
        </h1>
        <p class="m-0 text-base leading-6 text-[#4B5560]">{{ t('login.slogan') }}</p>
      </div>

      <!-- Photo: Tran Mau Tri Tam on Unsplash (Unsplash License). Hotlinked for now; self-host in public/ before release. -->
      <div class="relative min-h-30 flex-1 overflow-hidden rounded-2xl bg-[#EFE7DA]">
        <img
          src="https://images.unsplash.com/photo-1463424625195-3776f3c34a6b?fm=jpg&q=75&w=720&auto=format&fit=crop"
          :alt="t('login.heroAlt')"
          class="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <li v-for="key in (['login.benefit.nearby', 'login.benefit.price', 'login.benefit.payment'] as const)" :key="key"
          class="flex items-start gap-3">
          <svg class="mt-0.5 shrink-0 text-[#2E7D32]" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span class="text-base leading-6">{{ t(key) }}</span>
        </li>
      </ul>
    </div>

    <div class="flex shrink-0 flex-col gap-3 px-6 pt-6 pb-14">
      <div v-if="status === 'error'" role="alert"
        class="flex items-start gap-2 rounded-lg bg-[#FFE8E3] px-3 py-2.5 text-sm leading-5 font-bold text-[#C43A28]">
        <svg class="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{{ t('login.error') }}</span>
      </div>

      <button v-if="status === 'error'" type="button"
        class="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-[#2E7D32] px-4 font-[inherit] text-base font-extrabold whitespace-nowrap text-white"
        @click="fetchUser">
        {{ t('login.retry') }}
      </button>

      <!-- Also shown on error: a failed session check must not block signing in. -->
      <button type="button"
        class="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#CFC8BC] bg-white px-4 font-[inherit] text-base font-extrabold whitespace-nowrap text-[#1F2933] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="connecting || status === 'idle' || status === 'loading'" @click="startLogin">
        <svg class="shrink-0" width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {{ connecting ? t('login.openingGoogle') : t('login.continueWithGoogle') }}
      </button>

      <p class="m-0 text-center text-sm leading-5 text-[#6B7680]">
        {{ t('login.terms.prefix') }}
        <span class="underline">{{ t('login.terms.terms') }}</span> {{ t('login.terms.and') }}
        <span class="underline">{{ t('login.terms.privacy') }}</span>.
      </p>
    </div>
  </main>
</template>
