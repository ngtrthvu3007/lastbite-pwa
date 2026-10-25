import { defaultLocale, locales, messages, type Locale, type MessageKey } from "~/_i18n";
import { LOCALE_STATE_KEY, PLACEHOLDER_PATTERN } from "~/constants/i18n";

export const useTranslate = () => {
  // TODO: set the locale from the request header once that is decided.
  const locale = useState<Locale>(LOCALE_STATE_KEY, () => defaultLocale);

  // {name} placeholders are filled from params; a missing param stays visible instead of vanishing.
  // t() reads locale.value, so a template re-renders when the locale changes. In <script> the call
  // runs once: wrap it as computed(() => t('key')) or the text stays in the old language.
  const t = (key: MessageKey, params: Record<string, string | number> = {}) =>
    messages[locale.value][key].replace(PLACEHOLDER_PATTERN, (placeholder, name: string) =>
      String(params[name] ?? placeholder),
    );

  const setLocale = (next: Locale) => {
    if (locales.includes(next)) locale.value = next;
  };

  return { locale, t, setLocale };
};
