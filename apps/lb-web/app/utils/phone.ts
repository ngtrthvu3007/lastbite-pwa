import { PATTERN } from '~/constants/common'

export const toLocalPhone = (value: string) =>
  value.replace(PATTERN.PHONE_SEPARATOR, '').replace(PATTERN.PHONE_COUNTRY_CODE, '0')
