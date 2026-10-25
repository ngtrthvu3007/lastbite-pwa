<script setup lang="ts">
import { AUTH_MIDDLEWARE } from '~/constants/auth'

definePageMeta({ layout: 'merchant', middleware: AUTH_MIDDLEWARE })
</script>

<template>
  <Card class="mx-auto max-w-app">
    <template #content>
      <p class="mb-2 text-sm font-semibold text-primary">LastBite Merchant</p>
      <h1 class="m-0 text-2xl font-bold">Quản lý cửa hàng trong cùng một app</h1>

      <p class="mt-4 text-sm text-muted-color">
        Store và Quick Post chưa được triển khai. Khi các flow đó sẵn sàng, quyền thao tác sẽ
        được kiểm tra theo ownership của store ở backend.
      </p>
      <NuxtLink to="/" class="mt-5 inline-flex font-semibold text-primary hover:underline">
        Quay lại khám phá deal
      </NuxtLink>
    </template>
  </Card>
</template>
