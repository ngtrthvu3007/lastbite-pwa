import type { z } from 'zod'
import type { createPostSchema } from '~/schemas/post'

export type MerchantPostForm = z.infer<typeof createPostSchema>
export type MerchantPostField = keyof MerchantPostForm

export interface PostImageUpload {
  assetId: string
  uploadUrl: string
  fields: { name: string; value: string }[]
  expiresAt: string
}

export interface CreatePostImageUploadMutation {
  createPostImageUpload: PostImageUpload
}

export interface CreatePostImageUploadVariables {
  input: { contentType: string }
}

export interface CompletePostImageUploadMutation {
  completePostImageUpload: { id: string }
}

export interface CompletePostImageUploadVariables {
  assetId: string
}

export interface MerchantPost {
  id: string
}

export interface CreatePostMutation {
  createPost: MerchantPost
}

export interface CreatePostVariables {
  input: {
    imageAssetId: string
    title: string
    description?: string
    originalPrice?: number
    currentPrice: number
    quantity: number
    pickupStartAt: string
    pickupEndAt: string
    expiresAt: string
    storeName: string
    phone: string
    address: string
  }
}

export interface CustomerPostCard {
  id: string
  imageUrl: string
  title: string
  currentPrice: number
  remainingQuantity: number
  pickupEndAt: string
  storeName: string
}

export interface ActivePostsQuery {
  activePosts: CustomerPostCard[]
}

export interface PostQuery {
  post: (CustomerPostCard & {
    description: string | null
    originalPrice: number | null
    pickupStartAt: string
    expiresAt: string
    phone: string
    address: string
  }) | null
}
