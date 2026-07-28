// RisingTable.tsx — 신생 급상승 레포 (직전 수집 대비 증가 순, 최근 생성 레포)
import { useNavigate } from 'react-router-dom';
import type { RisingRepo } from '../types';
import { formatStars, formatDelta, formatRelativeTime, formatInt } from '../lib/format';
import { LoadingState, ErrorState } from './States';
import styles from './RisingTable.module.css';

interface RisingTableProps {
  data: RisingRepo[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function RisingTable({ data, loading, error, onRetry }: RisingTableProps) {
  const navigate = useNavigate();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) {
    return <div className={styles.empty}>아직 신생 레포가 없습니다 · 수집을 실행해 보세요</div>;
  }

  return (
    <table className="table table--rows">
      <thead>
        <tr>
          <th>Repo</th>
          <th>Lang</th>
          <th className="col-num">Stars</th>
          <th className="col-num">Δ 증가</th>
          <th className="col-num">Age</th>
        </tr>
      </thead>
      <tbody>
        {data.map((repo) => {
          const deltaClass =
            repo.star_delta > 0 ? 'delta delta--up'
            : repo.star_delta < 0 ? 'delta delta--down'
            : 'delta delta--flat';
          return (
            <tr
              key={repo.id}
              onClick={() => navigate(`/repos/${repo.id}`)}
              title={`≈ ${formatInt(Math.round(repo.velocity))}★/일 (평생 평균)`}
            >
              <td>
                <div className={`${styles.repoCell} truncate`}>{repo.full_name}</div>
              </td>
              <td>
                {repo.language ? (
                  <span className="tag">{repo.language}</span>
                ) : (
                  <span className="faint">—</span>
                )}
              </td>
              <td className="col-num">
                <span className="stars">★ {formatStars(repo.stars)}</span>
              </td>
              <td className="col-num">
                <span className={deltaClass}>{formatDelta(repo.star_delta)}</span>
              </td>
              <td className="col-num">
                <span className={styles.age}>{formatRelativeTime(repo.github_created_at)}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
