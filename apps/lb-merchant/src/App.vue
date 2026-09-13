<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
</script>

<template>
  <main class="min-h-screen bg-surface-50 p-6 text-color">
    <Card class="max-w-md">
      <template #title>LastBite Merchant</template>
      <template #subtitle>PrimeVue theme smoke test</template>
      <template #content>
        <p class="mb-4 text-sm text-red-400">
          If this card and button are styled, PrimeVue is wired correctly hakdajkdsakjdskj
        </p>

        <Button label="Create food post" />
      </template>
    </Card>
  </main>
</template>
