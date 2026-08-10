// DashboardPage.tsx — 대시보드: KPI 카드 5개(언어 top3 포함) + 신생 급상승 · 성장률 상위
import { useAsync } from '../lib/useAsync';
import { getStats, getTrends, getRising, getBookmarks, getLanguages } from '../api/stats';
import { formatCompactAge, formatInt } from '../lib/format';
import { LoadingState, ErrorState } from '../components/States';
import StatCard from '../components/StatCard';
import TrendTable from '../components/TrendTable';
import RisingTable from '../components/RisingTable';
import BookmarkTable from '../components/BookmarkTable';
import LangMiniCard from '../components/LangMiniCard';
import styles from './DashboardPage.module.css';
import { useTranslation } from 'react-i18next';
import { toSupportedLocale } from '../i18n';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = toSupportedLocale(i18n.resolvedLanguage) ?? 'en';
  const stats = useAsync(() => getStats(), []);
  const trends = useAsync(() => getTrends(8), []);
  const rising = useAsync(() => getRising(8), []);
  const bookmarks = useAsync(() => getBookmarks(), []);
  const languages = useAsync(() => getLanguages(), []);

  return (
    <div className="page">
      <div className="page__title">{t('dashboard.title')}</div>

      {/* ── KPI 카드 5개 (언어 top3 포함) ─────────────────────────────── */}
      <div className={`stagger grid-5 ${styles.statsGrid}`} style={{ marginBottom: 'var(--gap)' }}>
        {stats.loading ? (
          <>
            <StatCard label={t('dashboard.cards.projects')} value="—" hint={t('dashboard.cards.projectsHint')} />
            <StatCard label={t('dashboard.cards.filters')} value="—" hint={t('dashboard.cards.filtersHint')} />
            <StatCard label={t('dashboard.cards.saved')} value="—" hint={t('dashboard.cards.savedHint')} />
            <StatCard label={t('dashboard.cards.lastCollection')} value="—" hint={t('dashboard.cards.lastCollectionHint')} />
            <LangMiniCard data={null} loading />
          </>
        ) : stats.error ? (
          <div className={styles.statsError}>
            <ErrorState message={stats.error} onRetry={stats.reload} />
          </div>
        ) : stats.data ? (
          <>
            <StatCard
              label={t('dashboard.cards.projects')}
              value={formatInt(stats.data.total_repos, locale)}
              hint={t('dashboard.cards.projectsHint')}
            />
            <StatCard
              label={t('dashboard.cards.filters')}
              value={formatInt(stats.data.active_queries, locale)}
              hint={t('dashboard.cards.filtersHint')}
            />
            <StatCard
              label={t('dashboard.cards.saved')}
              value={formatInt(stats.data.bookmarked, locale)}
              hint={t('dashboard.cards.savedHint')}
            />
            <StatCard
              label={t('dashboard.cards.lastCollection')}
              value={stats.data.last_etl_at
                ? t('dashboard.cards.ago', { value: formatCompactAge(stats.data.last_etl_at, locale) })
                : '—'}
              hint={stats.data.last_etl_at ? t('dashboard.cards.lastCollectionHint') : t('dashboard.cards.none')}
            />
            <LangMiniCard data={languages.data} loading={languages.loading} />
          </>
        ) : null}
      </div>

      {/* ── 두 컬럼: 신생 급상승(메인) ‖ 성장률 상위 — 같은 높이 ─────── */}
      <div className={styles.columns}>
        {/* 신생 급상승 — 메인 */}
        <div className={styles.trendCol}>
          <div className={`panel panel--flush ${styles.fillPanel}`}>
            <div className={`panel__head ${styles.sectionHead}`}>
              <span className={`panel__title ${styles.sectionTitle}`}>{t('dashboard.rising.title')}</span>
              <span className={styles.titleEn}>{t('dashboard.rising.subtitle')}</span>
            </div>
            <div className={styles.panelBody}>
              {rising.loading ? (
                <div style={{ padding: 'var(--pad)' }}>
                  <LoadingState />
                </div>
              ) : (
                <RisingTable
                  data={rising.data}
                  loading={rising.loading}
                  error={rising.error}
                  onRetry={rising.reload}
                />
              )}
            </div>
          </div>
        </div>

        {/* 성장률 상위 — 보조 */}
        <div className={styles.langCol}>
          <div className={`panel panel--flush ${styles.fillPanel}`}>
            <div className={`panel__head ${styles.sectionHead}`}>
              <span className={`panel__title ${styles.sectionTitle}`}>{t('dashboard.movers.title')}</span>
              <span className={styles.titleEn}>{t('dashboard.movers.subtitle')}</span>
            </div>
            <div className={styles.panelBody}>
              {trends.loading ? (
                <div style={{ padding: 'var(--pad)' }}>
                  <LoadingState />
                </div>
              ) : (
                <TrendTable
                  data={trends.data}
                  loading={trends.loading}
                  error={trends.error}
                  onRetry={trends.reload}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 관심 레포 — 전체폭 ─────────────────────────────────────────── */}
      <div className="panel panel--flush" style={{ marginTop: 'var(--gap)' }}>
        <div className={`panel__head ${styles.sectionHead}`}>
          <span className={`panel__title ${styles.sectionTitle}`}>{t('dashboard.saved.title')}</span>
          <span className={styles.titleEn}>{t('dashboard.saved.subtitle')}</span>
        </div>
        <div className={styles.panelBody}>
          {bookmarks.loading ? (
            <div style={{ padding: 'var(--pad)' }}>
              <LoadingState />
            </div>
          ) : (
            <BookmarkTable
              data={bookmarks.data}
              loading={bookmarks.loading}
              error={bookmarks.error}
              onRetry={bookmarks.reload}
            />
          )}
        </div>
      </div>
    </div>
  );
}
