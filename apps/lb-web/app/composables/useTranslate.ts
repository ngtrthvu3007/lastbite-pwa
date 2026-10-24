import { defaultLocale, locales, messages, type Locale, type MessageKey } from '~/_i18n'

export function useTranslate() {
  // TODO: set the locale from the request header once that is decided.
  const locale = useState<Locale>('locale', () => defaultLocale)

  // {name} placeholders are filled from params; a missing param stays visible instead of vanishing.
  function t(key: MessageKey, params: Record<string, string | number> = {}) {
    const text = messages[locale.value]?.[key] ?? messages[defaultLocale][key]

    return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      String(params[name] ?? placeholder),
    )
  }

  function setLocale(next: Locale) {
    if (locales.includes(next)) locale.value = next
  }

  return { locale, t, setLocale }
}
