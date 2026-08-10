// RisingTable.tsx — 신생 급상승 레포 (최근 24시간 증가 순, 최근 생성 레포)
import { useNavigate } from 'react-router-dom';
import type { RisingRepo } from '../types';
import { formatStars, formatDelta, formatPercent, formatRelativeTime } from '../lib/format';
import { LoadingState, ErrorState } from './States';
import styles from './RisingTable.module.css';
import { useTranslation } from 'react-i18next';
import { toSupportedLocale } from '../i18n';

interface RisingTableProps {
  data: RisingRepo[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function RisingTable({ data, loading, error, onRetry }: RisingTableProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = toSupportedLocale(i18n.resolvedLanguage) ?? 'en';

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) {
    return <div className={styles.empty}>{t('dashboard.rising.empty')}</div>;
  }

  return (
    <table className={`table table--rows table--dense ${styles.table}`}>
      <thead>
        <tr>
          <th>{t('dashboard.table.project')}</th>
          <th>{t('dashboard.table.language')}</th>
          <th className="col-num">{t('dashboard.table.stars')}</th>
          <th className="col-num">{t('dashboard.table.increase24h')}</th>
          <th className="col-num">{t('dashboard.table.age')}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((repo) => {
          const deltaClass =
            repo.star_delta_24h > 0 ? 'delta delta--up'
            : repo.star_delta_24h < 0 ? 'delta delta--down'
            : 'delta delta--flat';
          return (
            <tr
              key={repo.id}
              onClick={() => navigate(`/repos/${repo.id}`)}
              title={t('dashboard.rising.detail', {
                delta: formatDelta(repo.star_delta_24h, locale),
                rate: formatPercent(repo.growth_rate_24h, 1, locale),
              })}
            >
              <td>
                <div className={`${styles.repoCell} truncate`} title={repo.full_name}>{repo.full_name}</div>
              </td>
              <td>
                {repo.language ? (
                  <span className="tag">{repo.language}</span>
                ) : (
                  <span className="faint">—</span>
                )}
              </td>
              <td className="col-num">
                <span className="stars">★ {formatStars(repo.stars, locale)}</span>
              </td>
              <td className="col-num">
                <span className={deltaClass}>{formatDelta(repo.star_delta_24h, locale)}</span>
              </td>
              <td className="col-num">
                <span className={styles.age}>{formatRelativeTime(repo.github_created_at, locale)}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
