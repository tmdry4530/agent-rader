import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './resources/en';
import { ko } from './resources/ko';

export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function toSupportedLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  const base = value.trim().toLowerCase().split('-')[0];
  return isSupportedLocale(base) ? base : null;
}

void i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LOCALES,
  load: 'languageOnly',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
