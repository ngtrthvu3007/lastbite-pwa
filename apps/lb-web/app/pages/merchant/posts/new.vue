<script setup lang="ts">
import { useFetchStore } from '~/composables/useFetchStore'
import { AUTH_MIDDLEWARE, LAYOUT, ROUTE } from '~/constants/routes'

definePageMeta({ layout: LAYOUT.MERCHANT, middleware: AUTH_MIDDLEWARE })

const { t } = useTranslate()
const { store, isLoading, error, refetch } = useFetchStore()
</script>

<template>
  <StatePage
    v-if="isLoading"
    icon="pi pi-spin pi-spinner"
    :title="t('store.loadingTitle')"
    :description="t('store.loadingDescription')"
  />

  <StatePage
    v-else-if="error"
    icon="pi pi-exclamation-circle"
    :title="t('store.loadFailedTitle')"
    :description="t('store.loadFailedDescription')"
    tone="danger"
  >
    <template #actions>
      <Button :label="t('store.retry')" class="w-full" @click="() => refetch()" />
    </template>
  </StatePage>

  <StatePage
    v-else-if="!store"
    icon="pi pi-shop"
    :title="t('postForm.storeRequiredTitle')"
    :description="t('postForm.storeRequiredDescription')"
  >
    <template #actions>
      <NuxtLink :to="ROUTE.MERCHANT_STORE_NEW" class="block">
        <Button :label="t('store.emptyCreate')" class="w-full" />
      </NuxtLink>
    </template>
  </StatePage>

  <MerchantPostSetupForm v-else :store />
</template>
