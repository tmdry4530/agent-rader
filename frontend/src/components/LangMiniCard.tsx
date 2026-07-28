// LangMiniCard.tsx — 상단 KPI 행에 들어가는 언어 분포 top3 카드
import type { LanguageStat } from '../types';
import { formatInt } from '../lib/format';
import styles from './LangMiniCard.module.css';

interface Props {
  data: LanguageStat[] | null;
  loading: boolean;
}

export default function LangMiniCard({ data, loading }: Props) {
  const top = (data ?? []).slice(0, 3);
  return (
    <div className={styles.card}>
      <div className={styles.label}>언어 분포 <span className={styles.en}>TOP 3</span></div>
      {loading || top.length === 0 ? (
        <div className={styles.empty}>{loading ? '…' : '데이터 없음'}</div>
      ) : (
        <ul className={styles.list}>
          {top.map((item, idx) => (
            <li key={`${item.language ?? 'unknown'}-${idx}`} className={styles.row}>
              <span className={styles.rank}>{idx + 1}</span>
              <span className={`${styles.name} truncate`}>{item.language ?? 'Unknown'}</span>
              <span className={styles.count}>{formatInt(item.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
