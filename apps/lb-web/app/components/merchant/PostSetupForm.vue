<script setup lang="ts">
import { POST } from '~/constants/post'
import { ROUTE } from '~/constants/routes'
import { usePostForm } from '~/composables/usePostForm'
import type { MerchantStore } from '~/types/store'

const props = defineProps<{ store: MerchantStore }>()
const { t } = useTranslate()
const { formState, imageError, onSubmit, selectedImage, setSelectedImage } = usePostForm(props.store)

const imageErrorText = computed(
  () => imageError.value && t(POST.ERROR_MESSAGE_KEY[imageError.value] ?? 'postError.imageInvalid'),
)

const selectImage = (event: Event) => {
  const input = event.target as HTMLInputElement
  setSelectedImage(input.files?.[0] ?? null)
}
</script>

<template>
  <section class="flex flex-1 flex-col py-6">
    <NuxtLink
      :to="ROUTE.MERCHANT"
      class="mb-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand hover:underline"
    >
      <i class="pi pi-arrow-left" aria-hidden="true" />
      {{ t('merchant.back') }}
    </NuxtLink>

    <div>
      <p class="m-0 text-sm font-bold text-brand">{{ t('postForm.overline') }}</p>
      <h1 class="mt-2 mb-2 text-3xl font-extrabold">{{ t('postForm.title') }}</h1>
      <p class="m-0 text-base text-neutral-700">{{ t('postForm.description') }}</p>
    </div>

    <form class="mt-8 flex flex-col gap-5 pb-safe" @submit.prevent="onSubmit">
      <div>
        <label for="post-image" class="mb-2 block text-sm font-bold">{{ t('postForm.imageLabel') }}</label>
        <input
          id="post-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="block w-full text-sm"
          :disabled="formState.isSubmitting"
          @change="selectImage"
        />
        <p v-if="selectedImage" class="mt-2 mb-0 text-sm text-neutral-700">{{ selectedImage.name }}</p>
        <small v-if="imageErrorText" class="mt-2 block text-sm font-bold text-danger">{{ imageErrorText }}</small>
      </div>

      <MerchantPostFormField name="title" :label="t('postForm.titleLabel')" :placeholder="t('postForm.titlePlaceholder')" />
      <MerchantPostFormField name="description" type="textarea" :label="t('postForm.descriptionLabel')" :placeholder="t('postForm.descriptionPlaceholder')" />

      <div class="grid grid-cols-2 gap-4">
        <MerchantPostFormField name="originalPrice" type="number" :label="t('postForm.originalPriceLabel')" />
        <MerchantPostFormField name="currentPrice" type="number" :label="t('postForm.currentPriceLabel')" />
      </div>
      <MerchantPostFormField name="quantity" type="number" :label="t('postForm.quantityLabel')" />

      <MerchantPostFormField name="pickupStartAt" type="datetime-local" :label="t('postForm.pickupStartLabel')" />
      <MerchantPostFormField name="pickupEndAt" type="datetime-local" :label="t('postForm.pickupEndLabel')" />
      <MerchantPostFormField name="expiresAt" type="datetime-local" :label="t('postForm.expiryLabel')" />

      <div class="border-t border-neutral-200 pt-5">
        <p class="m-0 text-sm font-bold text-brand">{{ t('postForm.contactOverline') }}</p>
        <p class="mt-1 mb-5 text-sm text-neutral-700">{{ t('postForm.contactDescription') }}</p>
        <div class="flex flex-col gap-5">
          <MerchantPostFormField name="storeName" :label="t('postForm.storeNameLabel')" />
          <MerchantPostFormField name="phone" type="tel" :label="t('postForm.phoneLabel')" />
          <MerchantPostFormField name="address" :label="t('postForm.addressLabel')" />
        </div>
      </div>

      <Button
        type="submit"
        class="mt-3 w-full"
        :label="formState.isSubmitting ? t('postForm.saving') : t('postForm.save')"
        :loading="formState.isSubmitting"
        :disabled="formState.isSubmitting"
      />
    </form>
  </section>
</template>
