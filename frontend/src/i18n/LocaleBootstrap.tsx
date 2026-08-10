import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getLocalization } from '../api/localization';
import i18n, { isSupportedLocale, toSupportedLocale } from './index';
import type { SupportedLocale } from './index';

export const LOCALE_STORAGE_KEY = 'trendar.uiLocale';

export function readStoredLocale(): SupportedLocale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(value)) return value;
    if (value !== null) window.localStorage.removeItem(LOCALE_STORAGE_KEY);
  } catch {
    // localStorage가 차단된 환경에서는 자동 선택만 사용한다.
  }
  return null;
}

export function detectBrowserLocale(): SupportedLocale {
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    const locale = toSupportedLocale(candidate);
    if (locale) return locale;
  }
  return 'en';
}

export async function applyLocale(locale: SupportedLocale, persist = false): Promise<void> {
  await i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
  if (!persist) return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // 저장할 수 없어도 현재 세션의 언어 변경은 유지한다.
  }
}

export default function LocaleBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const stored = readStoredLocale();
      let locale = stored;
      if (!locale) {
        try {
          const detected = await getLocalization();
          locale = isSupportedLocale(detected.locale) ? detected.locale : detectBrowserLocale();
        } catch {
          locale = detectBrowserLocale();
        }
      }
      await applyLocale(locale);
      if (active) setReady(true);
    }

    void initialize();
    return () => { active = false; };
  }, []);

  if (!ready) {
    return (
      <div className="app-shell">
        <main className="container" aria-busy="true" aria-label={i18n.t('language.detecting')}>
          <div className="state-brand">Trendar</div>
        </main>
      </div>
    );
  }

  return children;
}
