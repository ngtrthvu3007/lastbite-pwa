<script setup lang="ts">
import { useFetchUser } from '~/composables/useFetchUser'
import heroImg from '~~/assets/images/login-hero-img.jpg'

const route = useRoute()
const { t } = useTranslate()
const connecting = ref(false)
const { loginWithGoogle } = useAuth()
const { data: user, status, isLoading: isCheckingSession, refetch } = useFetchUser()

const hasError = computed(() => status.value === 'error')

// Only same-site paths: the backend also rejects a returnTo outside APP_URL.
const redirectPath = computed(() => toSafeRedirectPath(route.query.redirect))

watch(user, (current) => current && navigateTo(redirectPath.value), { immediate: true })

function startLogin() {
  connecting.value = true
  // Read at click time: the SSR request URL can be the internal host behind a proxy.
  loginWithGoogle(`${window.location.origin}${redirectPath.value}`)
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="flex min-h-0 flex-1 flex-col gap-5 pt-6">
      <AppLogo />

      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-3xl font-extrabold">
          {{ t('login.headline') }}
        </h1>
        <p class="m-0 text-base text-neutral-700">{{ t('login.slogan') }}</p>
      </div>

      <div class="relative min-h-30 flex-1 overflow-hidden rounded-2xl bg-neutral-200">
        <img :src="heroImg" :alt="t('login.heroAlt')" class="absolute inset-0 h-full w-full object-cover" />
      </div>

      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <li v-for="key in (['login.benefit.nearby', 'login.benefit.price', 'login.benefit.payment'] as const)"
          :key="key" class="flex items-start gap-3">
          <i class="pi pi-check mt-1 shrink-0 text-brand" aria-hidden="true" />
          <span class="text-base">{{ t(key) }}</span>
        </li>
      </ul>
    </div>

    <div class="flex shrink-0 flex-col gap-3 pt-6 pb-14">
      <div v-if="hasError" role="alert"
        class="flex items-start gap-2 rounded-sm bg-danger-soft px-3 py-2.5 text-sm font-bold text-danger">
        <i class="pi pi-exclamation-circle mt-0.5 shrink-0" aria-hidden="true" />
        <span>{{ t('login.error') }}</span>
      </div>

      <button v-if="hasError" type="button"
        class="flex h-touch w-full cursor-pointer items-center justify-center rounded-md border-0 bg-brand px-4 font-[inherit] text-base font-extrabold whitespace-nowrap text-white"
        @click="() => refetch()">
        {{ t('login.retry') }}
      </button>

      <!-- Also shown on error: a failed session check must not block signing in. -->
      <button type="button"
        class="flex h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-400 bg-white px-4 font-[inherit] text-base font-extrabold whitespace-nowrap text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="connecting || isCheckingSession" @click="startLogin">
        <GoogleIcon />
        {{ connecting ? t('login.openingGoogle') : t('login.continueWithGoogle') }}
      </button>

      <p class="m-0 text-center text-sm text-neutral-600">
        {{ t('login.terms.prefix') }}
        <span class="underline">{{ t('login.terms.terms') }}</span> {{ t('login.terms.and') }}
        <span class="underline">{{ t('login.terms.privacy') }}</span>.
      </p>
    </div>
  </div>
</template>
