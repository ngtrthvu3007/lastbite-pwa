<script setup lang="ts">
import { useController, useFieldError, useFormContext } from '@vuehookform/core'
import { POST } from '~/constants/post'
import type { MerchantPostField } from '~/types/post'

const props = defineProps<{
  name: MerchantPostField
  label: string
  placeholder?: string
  type?: 'text' | 'tel' | 'textarea' | 'number' | 'datetime-local'
}>()

const { t } = useTranslate()
const { formState } = useFormContext()
const { field } = useController({ name: props.name })
const error = useFieldError({ name: props.name })
const inputId = useId()
const errorId = computed(() => `${inputId}-error`)
const errorText = computed(
  () => error.value && t(POST.ERROR_MESSAGE_KEY[error.value] ?? 'postError.invalid'),
)

const onNumberChange = (value: string) => field.onChange(value === '' ? undefined : Number(value))
</script>

<template>
  <div>
    <label :for="inputId" class="mb-2 block text-sm font-bold">{{ label }}</label>
    <textarea
      v-if="type === 'textarea'"
      :id="inputId"
      :value="String(field.value.value ?? '')"
      class="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-brand"
      :placeholder
      :disabled="formState.isSubmitting"
      :aria-describedby="errorText ? errorId : undefined"
      @input="field.onChange(($event.target as HTMLTextAreaElement).value)"
      @blur="field.onBlur"
    />
    <input
      v-else
      :id="inputId"
      :type="type ?? 'text'"
      :value="field.value.value ?? ''"
      class="h-touch w-full rounded-md border border-neutral-300 bg-white px-3 text-base outline-none focus:border-brand"
      :placeholder
      :disabled="formState.isSubmitting"
      :aria-describedby="errorText ? errorId : undefined"
      @input="type === 'number' ? onNumberChange(($event.target as HTMLInputElement).value) : field.onChange(($event.target as HTMLInputElement).value)"
      @blur="field.onBlur"
    />
    <small v-if="errorText" :id="errorId" class="mt-2 block text-sm font-bold text-danger">
      {{ errorText }}
    </small>
  </div>
</template>
