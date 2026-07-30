// BookmarkTable.tsx — 관심 레포(북마크) 테이블
import { useNavigate } from 'react-router-dom';
import type { BookmarkRepo } from '../types';
import { formatStars, formatDelta } from '../lib/format';
import { LoadingState, ErrorState } from './States';
import styles from './BookmarkTable.module.css';

interface BookmarkTableProps {
  data: BookmarkRepo[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function BookmarkTable({ data, loading, error, onRetry }: BookmarkTableProps) {
  const navigate = useNavigate();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) {
    return <div className={styles.empty}>관심 레포를 북마크해 보세요</div>;
  }

  return (
    <table className="table table--rows table--dense">
      <thead>
        <tr>
          <th>Repo</th>
          <th>Lang</th>
          <th className="col-num">Stars</th>
          <th className="col-num">Δ 증가</th>
        </tr>
      </thead>
      <tbody>
        {data.map((repo) => {
          const deltaClass =
            repo.star_delta > 0 ? 'delta delta--up'
            : repo.star_delta < 0 ? 'delta delta--down'
            : 'delta delta--flat';
          return (
            <tr key={repo.id} onClick={() => navigate(`/repos/${repo.id}`)}>
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
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
