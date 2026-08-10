import { api } from './client';
import type { SupportedLocale } from '../i18n';

interface LocalizationResult {
  locale: SupportedLocale;
}

export const getLocalization = () => api.get<LocalizationResult>('/localization');
