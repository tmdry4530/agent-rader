import { useTranslation } from 'react-i18next';
import { applyLocale } from '../i18n/LocaleBootstrap';
import { toSupportedLocale } from '../i18n';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const locale = toSupportedLocale(i18n.resolvedLanguage) ?? 'en';

  return (
    <select
      className={styles.select}
      value={locale}
      aria-label={t('language.label')}
      onChange={(event) => {
        const next = toSupportedLocale(event.target.value);
        if (next) void applyLocale(next, true);
      }}
    >
      <option value="ko">{t('language.korean')}</option>
      <option value="en">{t('language.english')}</option>
    </select>
  );
}
