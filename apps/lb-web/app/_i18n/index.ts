import en from './en'
import vi from './vi'

export type { MessageKey } from './vi'

export const messages = { vi, en }

export type Locale = keyof typeof messages

export const defaultLocale: Locale = 'vi'

export const locales = Object.keys(messages) as Locale[]
