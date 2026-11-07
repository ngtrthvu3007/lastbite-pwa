<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { ACTIVE_POSTS_QUERY } from '~/api/post'
import type { ActivePostsQuery } from '~/types/post'

const { t } = useTranslate()
const { result, loading, error, refetch } = useQuery<ActivePostsQuery>(
  ACTIVE_POSTS_QUERY,
  { limit: 20 },
  { fetchPolicy: 'network-only' },
)
const posts = computed(() => result.value?.activePosts ?? [])
const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price)
</script>

<template>
  <section class="flex flex-col gap-5 py-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-bold text-brand">{{ t('customer.overline') }}</p>
        <h1 class="mt-1 mb-0 text-3xl font-extrabold">{{ t('customer.title') }}</h1>
      </div>
      <NuxtLink to="/merchant" class="text-sm font-bold text-brand hover:underline">{{ t('customer.merchant') }}</NuxtLink>
    </div>
    <StatePage v-if="loading" icon="pi pi-spin pi-spinner" :title="t('customer.loadingTitle')" :description="t('customer.loadingDescription')" />
    <StatePage v-else-if="error" icon="pi pi-exclamation-circle" :title="t('customer.loadFailedTitle')" :description="t('customer.loadFailedDescription')" tone="danger">
      <template #actions><Button :label="t('customer.retry')" class="w-full" @click="() => refetch()" /></template>
    </StatePage>
    <StatePage v-else-if="!posts.length" icon="pi pi-inbox" :title="t('customer.emptyTitle')" :description="t('customer.emptyDescription')" />
    <NuxtLink v-for="post in posts" :key="post.id" :to="`/posts/${post.id}`" class="overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-900">
      <img :src="post.imageUrl" :alt="post.title" class="h-44 w-full object-cover" />
      <div class="p-4">
        <p class="m-0 text-sm font-bold text-brand">{{ post.storeName }}</p>
        <h2 class="mt-1 mb-2 text-xl font-extrabold">{{ post.title }}</h2>
        <p class="m-0 text-lg font-extrabold text-accent-text">{{ formatPrice(post.currentPrice) }} đ</p>
        <p class="mt-2 mb-0 text-sm text-neutral-700">{{ t('customer.remaining', { quantity: post.remainingQuantity }) }}</p>
      </div>
    </NuxtLink>
  </section>
</template>
