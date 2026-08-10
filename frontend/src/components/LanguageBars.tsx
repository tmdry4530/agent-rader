// LanguageBars.tsx — 언어별 레포 수 수평 바 차트
import type { LanguageStat } from '../types';
import { LoadingState, ErrorState, EmptyState } from './States';
import styles from './LanguageBars.module.css';
import { useTranslation } from 'react-i18next';

interface LanguageBarsProps {
  data: LanguageStat[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function LanguageBars({ data, loading, error, onRetry }: LanguageBarsProps) {
  const { t } = useTranslation();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) {
    return <EmptyState title={t('dashboard.language.empty')} />;
  }

  // 하위 항목(1~2개짜리)이 길게 나열되지 않게 상위 7개 + '기타'로 집계
  const TOP = 7;
  const items: LanguageStat[] =
    data.length > TOP + 1
      ? [
          ...data.slice(0, TOP),
          {
            language: t('dashboard.language.other', { count: data.length - TOP }),
            count: data.slice(TOP).reduce((sum, d) => sum + d.count, 0),
          },
        ]
      : data;
  const maxCount = Math.max(...items.map((d) => d.count), 1);

  return (
    <div className={styles.list}>
      {items.map((item, idx) => {
        const label = item.language ?? t('dashboard.language.unknown');
        const widthPct = (item.count / maxCount) * 100;
        return (
          <div key={`${label}-${idx}`} className={styles.row}>
            <div className={styles.labelRow}>
              <span className={styles.langName}>{label}</span>
              <span className={styles.count}>{item.count}</span>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
