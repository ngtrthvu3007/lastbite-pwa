import { z } from 'zod'
import { PATTERN } from '~/constants/common'
import { STORE } from '~/constants/store'
import { toLocalPhone } from '~/utils/phone'

const { CONSTRAINTS, ERROR_CODE } = STORE

// The message of every issue is an error code, mapped to text by STORE.ERROR_MESSAGE_KEY.
export const createStoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CONSTRAINTS.REQUIRED_MIN_LENGTH, ERROR_CODE.NAME_REQUIRED)
    .min(CONSTRAINTS.NAME_MIN_LENGTH, ERROR_CODE.NAME_INVALID)
    .max(CONSTRAINTS.NAME_MAX_LENGTH, ERROR_CODE.NAME_INVALID),
  phone: z
    .string()
    .trim()
    .min(CONSTRAINTS.REQUIRED_MIN_LENGTH, ERROR_CODE.PHONE_REQUIRED)
    .refine((value) => PATTERN.PHONE_MOBILE.test(toLocalPhone(value)), ERROR_CODE.PHONE_INVALID),
  address: z
    .string()
    .trim()
    .min(CONSTRAINTS.REQUIRED_MIN_LENGTH, ERROR_CODE.ADDRESS_REQUIRED)
    .min(CONSTRAINTS.ADDRESS_MIN_LENGTH, ERROR_CODE.ADDRESS_INVALID)
    .max(CONSTRAINTS.ADDRESS_MAX_LENGTH, ERROR_CODE.ADDRESS_INVALID),
})

export const createStoreDefaultValues: z.infer<typeof createStoreSchema> = { name: '', phone: '', address: '' }
