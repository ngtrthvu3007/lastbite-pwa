<script setup lang="ts">
import type { MerchantStore } from '~/types/store'

const { t } = useTranslate()

defineProps<{ store: MerchantStore }>()
</script>

<template>
  <div class="rounded-md border border-neutral-200 bg-white p-5">
    <div class="mb-6 flex size-12 items-center justify-center rounded-full bg-brand-soft text-2xl text-brand">
      <i class="pi pi-shop" aria-hidden="true" />
    </div>
    <p class="m-0 text-sm font-bold text-brand">{{ t('store.detailsOverline') }}</p>
    <h1 class="mt-2 mb-6 text-3xl font-extrabold">{{ store.name }}</h1>

    <dl class="m-0 flex flex-col gap-5">
      <div>
        <dt class="text-sm font-bold text-neutral-600">{{ t('storeForm.phoneLabel') }}</dt>
        <dd class="mt-1 ml-0 text-base">{{ store.phone }}</dd>
      </div>
      <div>
        <dt class="text-sm font-bold text-neutral-600">{{ t('storeForm.addressLabel') }}</dt>
        <dd class="mt-1 ml-0 text-base">{{ store.address }}</dd>
      </div>
    </dl>
  </div>
</template>
