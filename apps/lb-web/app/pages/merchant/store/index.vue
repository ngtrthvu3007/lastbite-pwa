<script setup lang="ts">
import { useFetchStore } from '~/composables/useFetchStore'
import { AUTH_MIDDLEWARE, LAYOUT, ROUTE } from '~/constants/routes'

definePageMeta({ layout: LAYOUT.MERCHANT, middleware: AUTH_MIDDLEWARE })

const { t } = useTranslate()
const { store, isLoading, error, refetch } = useFetchStore()

const createStore = () => navigateTo(ROUTE.MERCHANT_STORE_NEW)
</script>

<template>
  <StatePage v-if="isLoading" icon="pi pi-spin pi-spinner" :title="t('store.loadingTitle')"
    :description="t('store.loadingDescription')" />

  <StatePage v-else-if="error" icon="pi pi-exclamation-circle" :title="t('store.loadFailedTitle')"
    :description="t('store.loadFailedDescription')" tone="danger">
    <template #actions>
      <Button :label="t('store.retry')" class="w-full" @click="() => refetch()" />
    </template>
  </StatePage>

  <StatePage v-else-if="!store" icon="pi pi-shop" :title="t('store.emptyTitle')"
    :description="t('store.emptyDescription')">
    <template #actions>
      <Button :label="t('store.emptyCreate')" class="w-full" @click="createStore" />
    </template>
  </StatePage>

  <section v-else class="flex flex-1 flex-col py-6">
    <NuxtLink :to="ROUTE.MERCHANT"
      class="mb-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand hover:underline">
      <i class="pi pi-arrow-left" aria-hidden="true" />
      {{ t('merchant.back') }}
    </NuxtLink>

    <MerchantStoreDetails :store />
  </section>
</template>
