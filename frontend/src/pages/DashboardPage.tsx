// DashboardPage.tsx — 대시보드: KPI 카드 5개(언어 top3 포함) + 신생 급상승 · 성장률 상위
import { useAsync } from '../lib/useAsync';
import { getStats, getTrends, getRising, getLanguages } from '../api/stats';
import { formatCompactAge, formatInt } from '../lib/format';
import { LoadingState, ErrorState } from '../components/States';
import StatCard from '../components/StatCard';
import TrendTable from '../components/TrendTable';
import RisingTable from '../components/RisingTable';
import LangMiniCard from '../components/LangMiniCard';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const stats = useAsync(() => getStats(), []);
  const trends = useAsync(() => getTrends(8), []);
  const rising = useAsync(() => getRising(8), []);
  const languages = useAsync(() => getLanguages(), []);

  return (
    <div className="page">
      <div className="page__title">DASHBOARD</div>

      {/* ── KPI 카드 5개 (언어 top3 포함) ─────────────────────────────── */}
      <div className="stagger grid-5" style={{ marginBottom: 'var(--gap)' }}>
        {stats.loading ? (
          <>
            <StatCard label="Repos" value="—" hint="추적 레포" />
            <StatCard label="Active Queries" value="—" hint="활성 조건" />
            <StatCard label="Bookmarked" value="—" hint="북마크" />
            <StatCard label="Last ETL" value="—" hint="마지막 수집" />
            <LangMiniCard data={null} loading />
          </>
        ) : stats.error ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ErrorState message={stats.error} onRetry={stats.reload} />
          </div>
        ) : stats.data ? (
          <>
            <StatCard
              label="Repos"
              value={formatInt(stats.data.total_repos)}
              hint="추적 레포"
            />
            <StatCard
              label="Active Queries"
              value={formatInt(stats.data.active_queries)}
              hint="활성 조건"
            />
            <StatCard
              label="Bookmarked"
              value={formatInt(stats.data.bookmarked)}
              hint="북마크"
            />
            <StatCard
              label="Last ETL"
              value={stats.data.last_etl_at ? `${formatCompactAge(stats.data.last_etl_at)} 전` : '—'}
              hint={stats.data.last_etl_at ? '마지막 수집' : '아직 없음'}
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
            <div className="panel__head" style={{ padding: 'var(--pad) var(--pad) 0' }}>
              <span className="panel__title">신생 급상승</span>
              <span className={styles.titleEn}>RISING · 최근 90일 내 생성</span>
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
            <div className="panel__head" style={{ padding: 'var(--pad) var(--pad) 0' }}>
              <span className="panel__title">성장률 상위</span>
              <span className={styles.titleEn}>TOP MOVERS</span>
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
                  compact
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
