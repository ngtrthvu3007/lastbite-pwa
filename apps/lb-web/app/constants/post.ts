import type { MessageKey } from '~/_i18n'

const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const IMAGE_MAX_BYTES = 5 * 1024 * 1024

const ERROR_CODE = {
  IMAGE_REQUIRED: 'IMAGE_REQUIRED',
  IMAGE_INVALID: 'IMAGE_INVALID',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  STORE_REQUIRED: 'STORE_REQUIRED',
  POST_IMAGE_NOT_READY: 'POST_IMAGE_NOT_READY',
} as const

const ERROR_MESSAGE_KEY: Record<string, MessageKey> = {
  [ERROR_CODE.IMAGE_REQUIRED]: 'postError.imageRequired',
  [ERROR_CODE.IMAGE_INVALID]: 'postError.imageInvalid',
  [ERROR_CODE.IMAGE_TOO_LARGE]: 'postError.imageTooLarge',
  TITLE_REQUIRED: 'postError.title',
  TITLE_INVALID: 'postError.title',
  DESCRIPTION_INVALID: 'postError.description',
  ORIGINAL_PRICE_INVALID: 'postError.price',
  CURRENT_PRICE_INVALID: 'postError.price',
  QUANTITY_INVALID: 'postError.quantity',
  PICKUP_START_INVALID: 'postError.time',
  PICKUP_END_INVALID: 'postError.time',
  EXPIRY_INVALID: 'postError.time',
  STORE_NAME_REQUIRED: 'postError.storeName',
  STORE_NAME_INVALID: 'postError.storeName',
  PHONE_REQUIRED: 'postError.phone',
  PHONE_INVALID: 'postError.phone',
  ADDRESS_REQUIRED: 'postError.address',
  ADDRESS_INVALID: 'postError.address',
}

export const POST = {
  IMAGE_CONTENT_TYPES,
  IMAGE_MAX_BYTES,
  ERROR_CODE,
  ERROR_MESSAGE_KEY,
}
