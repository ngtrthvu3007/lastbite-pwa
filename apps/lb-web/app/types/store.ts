import type { z } from 'zod'
import type { createStoreSchema } from '~/schemas/store'

export interface MerchantStore {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
}

export type MerchantStoreForm = z.infer<typeof createStoreSchema>

export type MerchantStoreField = keyof MerchantStoreForm

export interface MyStoreQuery {
  myStore: MerchantStore | null
}

export interface CreateStoreMutation {
  createStore: MerchantStore
}

export interface CreateStoreVariables {
  input: MerchantStoreForm
}
