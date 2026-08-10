// LoginPage.tsx — 비로그인 랜딩. 서비스를 예시로 보여주고 GitHub 로그인을 유도한다.
// GitHub OAuth 는 SPA 라우팅이 아닌 풀 페이지 이동으로 시작.
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import styles from './LoginPage.module.css';
const SAMPLE_REPOS = [
  { name: 'agent-mesh/orchestrator', lang: 'Python', stars: '14.2k', growth: '+9.1%' },
  { name: 'mcp-tools/registry', lang: 'TypeScript', stars: '8.7k', growth: '+15.3%' },
  { name: 'swarm-labs/autoflow', lang: 'Rust', stars: '5.1k', growth: '+22.4%' },
  { name: 'context-kit/memory', lang: 'Go', stars: '3.3k', growth: '+11.8%' },
];


export default function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorKeys: Record<string, string> = {
    denied: 'login.errors.denied',
    state: 'login.errors.state',
    exchange: 'login.errors.exchange',
    profile: 'login.errors.profile',
  };
  const errorMessage = error ? t(errorKeys[error] ?? 'login.errors.unknown') : null;
  const limits = [t('login.limits.current'), t('login.limits.interest'), t('login.limits.history')];
  const solves = [t('login.solves.growth'), t('login.solves.interest'), t('login.solves.history')];
  const features = [
    { tag: t('login.features.growthTag'), title: t('login.features.growthTitle'), desc: t('login.features.growthDesc') },
    { tag: t('login.features.chartTag'), title: t('login.features.chartTitle'), desc: t('login.features.chartDesc') },
    { tag: t('login.features.overviewTag'), title: t('login.features.overviewTitle'), desc: t('login.features.overviewDesc') },
    { tag: t('login.features.saveTag'), title: t('login.features.saveTitle'), desc: t('login.features.saveDesc') },
  ];
  const sampleStats = [
    { label: t('login.sampleStats.projects'), value: '128', hint: t('login.sampleStats.tracked') },
    { label: t('login.sampleStats.filters'), value: '4', hint: t('login.sampleStats.active') },
    { label: t('login.sampleStats.lastCollection'), value: t('login.sampleStats.lastValue'), hint: t('login.sampleStats.ago') },
  ];
  const steps = [
    { n: '1', title: t('login.steps.oneTitle'), desc: t('login.steps.oneDesc') },
    { n: '2', title: t('login.steps.twoTitle'), desc: t('login.steps.twoDesc') },
    { n: '3', title: t('login.steps.threeTitle'), desc: t('login.steps.threeDesc') },
  ];

  return (
    <div className={styles.landing}>
      <div className={styles.languageRow}><LanguageSwitcher /></div>
      {/* ── hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.logo}>◎</span>
          <span className={styles.brandName}>Trendar</span>
          <span className={styles.eyebrow}>{t('login.tagline')}</span>
        </div>

        <h1 className={styles.headline}>
          {t('login.headline')}<br />
          <span className={styles.accent}>{t('login.headlineAccent')}</span>.
        </h1>
        <p className={styles.sub}>
          {t('login.intro')}
        </p>

        {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

        <a href="/api/auth/github" className={`btn btn--primary ${styles.loginBtn}`}>
          <GithubIcon />
          {t('login.start')}
        </a>
        <p className={styles.trust}>{t('login.trust')}</p>
        <p className={styles.locationNotice}>{t('login.locationNotice')}</p>
      </section>

      {/* ── 왜 Trendar인가 (한계 vs 해결) ────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t('login.why')}</div>
        <div className={styles.compare}>
          <div className={`panel ${styles.compareCol}`}>
            <div className={styles.compareHead}>{t('login.githubLimits')}</div>
            <ul className={styles.checklist}>
              {limits.map((text) => (
                <li key={text} className={styles.limit}><span className={styles.markX}>✕</span>{text}</li>
              ))}
            </ul>
          </div>
          <div className={`panel ${styles.compareCol} ${styles.compareColPro}`}>
            <div className={styles.compareHead}>{t('login.trendarSolves')}</div>
            <ul className={styles.checklist}>
              {solves.map((text) => (
                <li key={text} className={styles.solve}><span className={styles.markCheck}>✓</span>{text}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 무엇을 얻나 ──────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t('login.benefits')}</div>
        <div className={styles.features}>
          {features.map((f) => (
            <div key={f.tag} className={`panel ${styles.featureCard}`}>
              <span className={styles.featureTag}>{f.tag}</span>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 미리보기 + 사용법 ────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t('login.preview')}</div>
        <div className={styles.showcase}>
          <div className={styles.previewSide}>
            {/* 대시보드 스탯 미리보기 */}
            <div className={styles.statRow}>
              {sampleStats.map((s) => (
                <div key={s.label} className={`panel ${styles.statCard}`}>
                  <div className={styles.statLabel}>{s.label}</div>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statHint}>{s.hint}</div>
                </div>
              ))}
            </div>

            {/* 지금 뜨는 레포 미리보기 */}
            <div className={`panel panel--flush ${styles.previewCard}`}>
              <div className={styles.previewHead}>
                <span className={styles.previewTitle}>{t('login.previewTitle')}</span>
                <span className="pill">{t('login.samplePreview')}</span>
              </div>
              <table className="table table--center">
                <thead>
                  <tr>
                    <th>{t('login.table.project')}</th>
                    <th>{t('login.table.language')}</th>
                    <th className="col-num">{t('login.table.stars')}</th>
                    <th className="col-num">{t('login.table.growth')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_REPOS.map((r) => (
                    <tr key={r.name}>
                      <td><b className="mono">{r.name}</b></td>
                      <td><span className="tag">{r.lang}</span></td>
                      <td className="col-num"><span className="num">★ {r.stars}</span></td>
                      <td className="col-num"><span className="delta delta--up">{r.growth}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 사용법 3단계 */}
          <div className={styles.steps}>
            <div className={styles.stepsTitle}>{t('login.stepsTitle')}</div>
            {steps.map((s) => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <div>
                  <div className={styles.stepTitle}>{s.title}</div>
                  <div className={styles.stepDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 최종 CTA ─────────────────────────────────────────── */}
      <section className={`panel ${styles.ctaBand}`}>
        <div className={styles.ctaText}>
          <div className={styles.ctaTitle}>{t('login.ctaTitle')}</div>
          <div className={styles.ctaSub}>{t('login.ctaSub')}</div>
        </div>
        <a href="/api/auth/github" className={`btn btn--primary ${styles.ctaBtn}`}>
          <GithubIcon />
          {t('login.start')}
        </a>
      </section>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
