<script setup lang="ts">
import { useController, useFieldError, useFormContext } from '@vuehookform/core'
import { STORE } from '~/constants/store'
import type { MerchantStoreField } from '~/types/store'

const props = defineProps<{ name: MerchantStoreField }>()

const { t } = useTranslate()
const { formState } = useFormContext()
const { field } = useController({ name: props.name })
const error = useFieldError({ name: props.name })
const { autocomplete, inputmode } = STORE.FIELD_INPUT[props.name]
const inputId = useId()

// The error is a code (from zod or the API), shown as text; an unknown code gets a generic text.
const errorText = computed(
  () => error.value && t(STORE.ERROR_MESSAGE_KEY[error.value] ?? 'storeError.invalid', STORE.MESSAGE_PARAMS),
)
const errorId = computed(() => `${inputId}-error`)
</script>

<template>
  <div>
    <label :for="inputId" class="mb-2 block text-sm font-bold">{{ t(`storeForm.${name}Label`) }}</label>
    <InputText
      :id="inputId"
      :model-value="String(field.value.value ?? '')"
      class="w-full"
      :autocomplete
      :inputmode
      :placeholder="t(`storeForm.${name}Placeholder`)"
      :disabled="formState.isSubmitting"
      :invalid="Boolean(errorText)"
      :aria-describedby="errorText ? errorId : undefined"
      @update:model-value="field.onChange"
      @blur="field.onBlur"
    />
    <small v-if="errorText" :id="errorId" class="mt-2 block text-sm font-bold text-danger">
      {{ errorText }}
    </small>
  </div>
</template>
