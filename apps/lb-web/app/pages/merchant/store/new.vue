<script setup lang="ts">
import { useStoreForm } from '~/composables/useStoreForm';
import { AUTH_MIDDLEWARE, LAYOUT, ROUTE } from '~/constants/routes'

definePageMeta({ layout: LAYOUT.MERCHANT, middleware: AUTH_MIDDLEWARE })

const { onSubmit, hasExistingStoreError } = useStoreForm({
  onCreated: () => navigateTo(ROUTE.MERCHANT),
})
</script>

<template>
  <MerchantStoreSetupForm :has-existing-store-error @submit="onSubmit" />
</template>
