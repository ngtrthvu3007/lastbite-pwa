<script setup lang="ts">
const { locale } = useTranslate()

useHead({ htmlAttrs: { lang: locale } })
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <Toast position="top-center" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
