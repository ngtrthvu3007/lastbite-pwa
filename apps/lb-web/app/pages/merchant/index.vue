<script setup lang="ts">
import { AUTH_MIDDLEWARE, LAYOUT, ROUTE } from '~/constants/routes'

definePageMeta({ layout: LAYOUT.MERCHANT, middleware: AUTH_MIDDLEWARE })

const { t } = useTranslate()
</script>

<template>
  <section class="flex flex-1 flex-col py-6">
    <NuxtLink :to="ROUTE.HOME" class="mb-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand hover:underline">
      <i class="pi pi-arrow-left" aria-hidden="true" />
      {{ t('merchant.back') }}
    </NuxtLink>

    <NuxtLink
      :to="ROUTE.MERCHANT_STORE"
      class="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-5 text-base font-bold"
    >
      <i class="pi pi-shop text-brand" aria-hidden="true" />
      <span class="flex-1">{{ t('merchant.homeStore') }}</span>
      <i class="pi pi-angle-right text-neutral-600" aria-hidden="true" />
    </NuxtLink>
  </section>
</template>
