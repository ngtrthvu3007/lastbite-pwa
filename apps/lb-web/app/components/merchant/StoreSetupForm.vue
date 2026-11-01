<script setup lang="ts">
import { useFormContext } from '@vuehookform/core'
import { ROUTE } from '~/constants/routes'
import { STORE } from '~/constants/store'

const { t } = useTranslate()
const { formState } = useFormContext()

defineProps<{ hasExistingStoreError: boolean }>()

const emit = defineEmits<{ submit: [event: Event] }>()

const FIELDS = Object.values(STORE.FIELD)
</script>

<template>
  <section class="flex flex-1 flex-col py-6">
    <NuxtLink
      :to="ROUTE.MERCHANT_STORE"
      class="mb-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand hover:underline"
    >
      <i class="pi pi-arrow-left" aria-hidden="true" />
      {{ t('merchant.back') }}
    </NuxtLink>

    <div class="flex flex-1 flex-col">
      <div>
        <p class="m-0 text-sm font-bold text-brand">{{ t('storeForm.overline') }}</p>
        <h1 class="mt-2 mb-2 text-3xl font-extrabold">{{ t('storeForm.title') }}</h1>
        <p class="m-0 text-base text-neutral-700">{{ t('storeForm.description') }}</p>
      </div>

      <form class="mt-8 flex flex-1 flex-col gap-5" @submit.prevent="emit('submit', $event)">
        <div v-if="hasExistingStoreError" role="alert" class="rounded-sm bg-accent-soft px-3 py-2.5 text-sm font-bold text-accent-text">
          <p class="m-0">{{ t('storeForm.alreadyExists') }}</p>
          <NuxtLink :to="ROUTE.MERCHANT_STORE" class="mt-2 inline-block font-bold underline">
            {{ t('storeForm.showStore') }}
          </NuxtLink>
        </div>

        <MerchantStoreFormField v-for="field in FIELDS" :key="field" :name="field" />

        <Button
          type="submit"
          class="mt-auto w-full"
          :label="formState.isSubmitting ? t('storeForm.saving') : t('storeForm.save')"
          :loading="formState.isSubmitting"
          :disabled="formState.isSubmitting"
        />
      </form>
    </div>
  </section>
</template>
