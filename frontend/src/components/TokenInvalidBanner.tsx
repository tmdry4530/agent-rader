// TokenInvalidBanner.tsx — GitHub 토큰이 무효화된 경우 전 화면 상단에 재로그인을 유도.
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './TokenInvalidBanner.module.css';

export default function TokenInvalidBanner() {
  const { me } = useAuth();
  const { t } = useTranslation();

  if (!me?.tokenInvalid) return null;

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.text}>
        {t('auth.githubExpired')}
      </span>
      <a href="/api/auth/github" className={`btn btn--sm ${styles.action}`}>
        {t('auth.signInAgain')}
      </a>
    </div>
  );
}
