<!-- Full-screen state (error, empty, denied, offline): message centred, actions in the thumb zone. -->
<script setup lang="ts">
const tones = {
  brand: 'text-brand',
  accent: 'text-accent',
  danger: 'text-danger',
}

withDefaults(
  defineProps<{
    // A primeicons class, e.g. "pi pi-search".
    icon: string
    title: string
    description: string
    tone?: keyof typeof tones
  }>(),
  { tone: 'brand' },
)
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <i :class="[icon, tones[tone]]" class="mb-3 text-5xl!" aria-hidden="true" />
      <h1 class="m-0 text-2xl font-extrabold">{{ title }}</h1>
      <p class="m-0 text-base text-neutral-700">{{ description }}</p>
    </div>

    <div class="flex flex-col gap-2 pb-safe">
      <slot name="actions" />
    </div>
  </div>
</template>
