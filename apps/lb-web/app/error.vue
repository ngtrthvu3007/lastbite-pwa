<script setup lang="ts">
import type { NuxtError } from '#app'
import { ROUTE } from '~/constants/routes'

const props = defineProps<{ error: NuxtError }>()
const { t } = useTranslate()
const router = useRouter()

const isNotFound = computed(() => props.error.status === 404)

// vue-router keeps the previous path in history.state; none means the app was opened on this URL.
const canGoBack = ref(false)
onMounted(() => (canGoBack.value = Boolean(window.history.state?.back)))

function goHome() {
  return clearError({ redirect: ROUTE.HOME })
}

async function goBack() {
  await clearError()
  router.back()
}
</script>

<template>
  <NuxtLayout>
    <StatePage :icon="isNotFound ? 'pi pi-search' : 'pi pi-exclamation-triangle'"
      :tone="isNotFound ? 'brand' : 'danger'" :title="isNotFound ? t('error.notFoundTitle') : t('error.title')"
      :description="isNotFound ? t('error.notFound') : t('error.generic')">
      <template #actions>
        <template v-if="isNotFound">
          <Button :label="t('error.home')" fluid @click="goHome" />
          <Button v-if="canGoBack" :label="t('error.back')" variant="text" fluid @click="goBack" />
        </template>
        <template v-else>
          <Button :label="t('error.reload')" fluid @click="reloadNuxtApp()" />
          <Button :label="t('error.home')" variant="text" fluid @click="goHome" />
        </template>
      </template>
    </StatePage>
  </NuxtLayout>
</template>
