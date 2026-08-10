const SUPPORTED_LOCALES = new Set(['ko', 'en']);
const MAX_HEADER_LENGTH = 512;
const MAX_LANGUAGE_ITEMS = 10;
const LANGUAGE_TAG = /^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/i;

export function parseAcceptLanguage(header) {
  if (typeof header !== 'string' || header.length === 0) return [];

  const parsed = header
    .slice(0, MAX_HEADER_LENGTH)
    .split(',')
    .slice(0, MAX_LANGUAGE_ITEMS)
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(';');
      const tag = rawTag?.trim();
      if (!tag || tag === '*' || !LANGUAGE_TAG.test(tag)) return null;

      let quality = 1;
      for (const param of params) {
        const match = /^q\s*=\s*([0-9.]+)$/i.exec(param.trim());
        if (!match) return null;
        quality = Number(match[1]);
        if (!Number.isFinite(quality) || quality <= 0 || quality > 1) return null;
      }
      return { locale: tag.toLowerCase().split('-')[0], quality, index };
    })
    .filter(Boolean)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return [...new Set(parsed.map((item) => item.locale))];
}

export function resolveLocale({ countryCode, acceptedLanguages = [] }) {
  const country = typeof countryCode === 'string' ? countryCode.toUpperCase() : null;
  const countryLocales = country === 'KR' ? ['ko'] : country ? ['en'] : null;

  if (countryLocales) {
    const preferred = acceptedLanguages.find(
      (locale) => SUPPORTED_LOCALES.has(locale) && countryLocales.includes(locale)
    );
    return preferred || countryLocales[0];
  }

  return acceptedLanguages.find((locale) => SUPPORTED_LOCALES.has(locale)) || 'en';
}
