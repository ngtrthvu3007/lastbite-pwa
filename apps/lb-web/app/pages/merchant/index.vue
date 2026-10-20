<script setup lang="ts">
const { user, status } = useAuth()
const redirect = encodeURIComponent('/merchant')
</script>

<template>
  <main class="min-h-screen bg-surface-50 p-6 text-color">
    <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
      <p class="mb-2 text-sm font-semibold text-primary">LastBite Merchant</p>
      <h1 class="m-0 text-2xl font-bold">Quản lý cửa hàng trong cùng một app</h1>

      <p v-if="status === 'loading'" class="mt-4 text-sm text-muted-color">Đang kiểm tra phiên đăng nhập…</p>

      <template v-else-if="!user">
        <p class="mt-4 text-sm text-muted-color">
          Đăng nhập để tạo hoặc quản lý cửa hàng của bạn.
        </p>
        <NuxtLink
          :to="`/login?redirect=${redirect}`"
          class="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-white"
        >
          Tiếp tục với Google
        </NuxtLink>
      </template>

      <template v-else>
        <p class="mt-4 text-sm text-muted-color">
          Store và Quick Post chưa được triển khai. Khi các flow đó sẵn sàng, quyền thao tác sẽ
          được kiểm tra theo ownership của store ở backend.
        </p>
        <NuxtLink to="/" class="mt-5 inline-flex font-semibold text-primary hover:underline">
          Quay lại khám phá deal
        </NuxtLink>
      </template>
    </section>
  </main>
</template>
