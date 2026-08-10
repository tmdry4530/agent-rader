// LangMiniCard.tsx — 상단 KPI 행에 들어가는 언어 분포 top3 카드
import type { LanguageStat } from '../types';
import { formatInt } from '../lib/format';
import styles from './LangMiniCard.module.css';
import { useTranslation } from 'react-i18next';
import { toSupportedLocale } from '../i18n';

interface Props {
  data: LanguageStat[] | null;
  loading: boolean;
}

export default function LangMiniCard({ data, loading }: Props) {
  const { t, i18n } = useTranslation();
  const locale = toSupportedLocale(i18n.resolvedLanguage) ?? 'en';
  const top = (data ?? []).slice(0, 3);
  return (
    <div className={styles.card}>
      <div className={styles.label}>{t('dashboard.language.title')} <span className={styles.en}>{t('dashboard.language.top')}</span></div>
      {loading || top.length === 0 ? (
        <div className={styles.empty}>{loading ? '…' : t('dashboard.language.noData')}</div>
      ) : (
        <ul className={styles.list}>
          {top.map((item, idx) => (
            <li key={`${item.language ?? 'unknown'}-${idx}`} className={styles.row}>
              <span className={styles.rank}>{idx + 1}</span>
              <span className={`${styles.name} truncate`}>{item.language ?? t('dashboard.language.unknown')}</span>
              <span className={styles.count}>{formatInt(item.count, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
