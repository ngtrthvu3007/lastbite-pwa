<script setup lang="ts">
const { locale } = useTranslate()

useHead({ htmlAttrs: { lang: locale } })
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
