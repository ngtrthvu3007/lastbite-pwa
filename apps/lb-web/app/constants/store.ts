import type { MessageKey } from '~/_i18n'

const FIELD = {
  NAME: 'name',
  PHONE: 'phone',
  ADDRESS: 'address',
} as const

const CONSTRAINTS = {
  REQUIRED_MIN_LENGTH: 1,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  ADDRESS_MIN_LENGTH: 5,
  ADDRESS_MAX_LENGTH: 255,
} as const

const ERROR_CODE = {
  NAME_REQUIRED: 'NAME_REQUIRED',
  NAME_INVALID: 'NAME_INVALID',
  PHONE_REQUIRED: 'PHONE_REQUIRED',
  PHONE_INVALID: 'PHONE_INVALID',
  ADDRESS_REQUIRED: 'ADDRESS_REQUIRED',
  ADDRESS_INVALID: 'ADDRESS_INVALID',
  ALREADY_EXISTS: 'STORE_ALREADY_EXISTS',
} as const

// How the browser treats each input: autofill and the mobile keyboard.
const FIELD_INPUT: Record<(typeof FIELD)[keyof typeof FIELD], { autocomplete: string; inputmode?: 'tel' }> = {
  [FIELD.NAME]: { autocomplete: 'organization' },
  [FIELD.PHONE]: { autocomplete: 'tel', inputmode: 'tel' },
  [FIELD.ADDRESS]: { autocomplete: 'street-address' },
}

const ERROR_MESSAGE_KEY: Record<string, MessageKey> = {
  [ERROR_CODE.NAME_REQUIRED]: 'storeError.nameRequired',
  [ERROR_CODE.NAME_INVALID]: 'storeError.nameInvalid',
  [ERROR_CODE.PHONE_REQUIRED]: 'storeError.phoneRequired',
  [ERROR_CODE.PHONE_INVALID]: 'storeError.phoneInvalid',
  [ERROR_CODE.ADDRESS_REQUIRED]: 'storeError.addressRequired',
  [ERROR_CODE.ADDRESS_INVALID]: 'storeError.addressInvalid',
}

export const STORE = {
  FIELD,
  FIELD_INPUT,
  CONSTRAINTS,
  ERROR_CODE,
  ERROR_MESSAGE_KEY,

  // Fills the {nameMin}-style placeholders of the length messages; other messages ignore them.
  MESSAGE_PARAMS: {
    nameMin: CONSTRAINTS.NAME_MIN_LENGTH,
    nameMax: CONSTRAINTS.NAME_MAX_LENGTH,
    addressMin: CONSTRAINTS.ADDRESS_MIN_LENGTH,
    addressMax: CONSTRAINTS.ADDRESS_MAX_LENGTH,
  },
}
