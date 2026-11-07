<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { POST_QUERY } from '~/api/post'
import type { PostQuery } from '~/types/post'

const route = useRoute()
const { t } = useTranslate()
const { result, loading, error, refetch } = useQuery<PostQuery>(
  POST_QUERY,
  { id: route.params.id },
  { fetchPolicy: 'network-only' },
)
const post = computed(() => result.value?.post ?? null)
const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price)
</script>

<template>
  <section class="flex flex-col gap-5 py-6">
    <NuxtLink to="/" class="inline-flex w-fit items-center gap-2 text-sm font-bold text-brand hover:underline">
      <i class="pi pi-arrow-left" aria-hidden="true" />
      {{ t('customer.back') }}
    </NuxtLink>
    <StatePage
      v-if="loading"
      icon="pi pi-spin pi-spinner"
      :title="t('customer.loadingTitle')"
      :description="t('customer.loadingDescription')"
    />
    <StatePage
      v-else-if="error"
      icon="pi pi-exclamation-circle"
      :title="t('customer.loadFailedTitle')"
      :description="t('customer.loadFailedDescription')"
      tone="danger"
    >
      <template #actions>
        <Button :label="t('customer.retry')" class="w-full" @click="() => refetch()" />
      </template>
    </StatePage>
    <StatePage v-else-if="!post" icon="pi pi-inbox" :title="t('customer.notFoundTitle')" :description="t('customer.notFoundDescription')" />
    <article v-else class="overflow-hidden rounded-md border border-neutral-200 bg-white">
      <img :src="post.imageUrl" :alt="post.title" class="h-56 w-full object-cover" />
      <div class="p-5">
        <p class="m-0 text-sm font-bold text-brand">{{ post.storeName }}</p>
        <h1 class="mt-1 mb-2 text-3xl font-extrabold">{{ post.title }}</h1>
        <p class="m-0 text-xl font-extrabold text-accent-text">{{ formatPrice(post.currentPrice) }} đ</p>
        <p v-if="post.description" class="mt-5 mb-0 text-base text-neutral-700">
          {{ post.description }}
        </p>
        <dl class="mt-6 mb-0 flex flex-col gap-4 text-sm">
          <div>
            <dt class="font-bold text-neutral-600">{{ t('customer.remainingLabel') }}</dt>
            <dd class="mt-1 ml-0">{{ post.remainingQuantity }}</dd>
          </div>
          <div>
            <dt class="font-bold text-neutral-600">{{ t('customer.phoneLabel') }}</dt>
            <dd class="mt-1 ml-0">{{ post.phone }}</dd>
          </div>
          <div>
            <dt class="font-bold text-neutral-600">{{ t('customer.addressLabel') }}</dt>
            <dd class="mt-1 ml-0">{{ post.address }}</dd>
          </div>
        </dl>
      </div>
    </article>
  </section>
</template>
