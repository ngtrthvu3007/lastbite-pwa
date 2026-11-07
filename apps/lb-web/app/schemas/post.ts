import { z } from 'zod'
import { PATTERN } from '~/constants/common'

const toLocalPhone = (value: string) =>
  value.replace(PATTERN.PHONE_SEPARATOR, '').replace(PATTERN.PHONE_COUNTRY_CODE, '0')

const requiredText = (requiredCode: string, invalidCode: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, requiredCode)
    .min(min, invalidCode)
    .max(max, invalidCode)

const requiredNumber = (code: string, min: number) =>
  z.number({ error: code }).int(code).min(min, code)

const isValidDateTime = (value: string) => Number.isFinite(new Date(value).getTime())

export const createPostSchema = z.object({
  title: requiredText('TITLE_REQUIRED', 'TITLE_INVALID', 2, 120),
  description: z.string().trim().max(1000, 'DESCRIPTION_INVALID').optional(),
  originalPrice: z.number({ error: 'ORIGINAL_PRICE_INVALID' }).int('ORIGINAL_PRICE_INVALID').min(0, 'ORIGINAL_PRICE_INVALID').optional(),
  currentPrice: requiredNumber('CURRENT_PRICE_INVALID', 0),
  quantity: requiredNumber('QUANTITY_INVALID', 1),
  pickupStartAt: z.string().min(1, 'PICKUP_START_INVALID'),
  pickupEndAt: z.string().min(1, 'PICKUP_END_INVALID'),
  expiresAt: z.string().min(1, 'EXPIRY_INVALID'),
  storeName: requiredText('STORE_NAME_REQUIRED', 'STORE_NAME_INVALID', 2, 100),
  phone: z
    .string()
    .trim()
    .min(1, 'PHONE_REQUIRED')
    .refine((value) => PATTERN.PHONE_MOBILE.test(toLocalPhone(value)), 'PHONE_INVALID'),
  address: requiredText('ADDRESS_REQUIRED', 'ADDRESS_INVALID', 5, 255),
}).superRefine((values, context) => {
  const dateFields = [
    ['pickupStartAt', 'PICKUP_START_INVALID'],
    ['pickupEndAt', 'PICKUP_END_INVALID'],
    ['expiresAt', 'EXPIRY_INVALID'],
  ] as const

  for (const [field, code] of dateFields) {
    if (isValidDateTime(values[field])) continue

    context.addIssue({ code: 'custom', message: code, path: [field] })
  }

  if (!dateFields.every(([field]) => isValidDateTime(values[field]))) return

  const pickupStartAt = new Date(values.pickupStartAt)
  const pickupEndAt = new Date(values.pickupEndAt)
  const expiresAt = new Date(values.expiresAt)

  if (pickupStartAt >= pickupEndAt) {
    context.addIssue({ code: 'custom', message: 'PICKUP_END_INVALID', path: ['pickupEndAt'] })
  }

  if (expiresAt > pickupEndAt || expiresAt <= new Date()) {
    context.addIssue({ code: 'custom', message: 'EXPIRY_INVALID', path: ['expiresAt'] })
  }
})

export const createPostDefaultValues = (store: { name: string; phone: string; address: string }) => ({
  title: '',
  description: '',
  originalPrice: undefined,
  currentPrice: undefined,
  quantity: undefined,
  pickupStartAt: '',
  pickupEndAt: '',
  expiresAt: '',
  storeName: store.name,
  phone: store.phone,
  address: store.address,
})
