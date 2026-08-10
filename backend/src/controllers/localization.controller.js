import { countryResolver as defaultCountryResolver } from '../services/country-resolver.js';
import { parseAcceptLanguage, resolveLocale } from '../utils/locale.js';

export function getClientIp(req) {
  const header = typeof req.get === 'function'
    ? req.get('x-real-ip')
    : req.headers?.['x-real-ip'];
  if (typeof header === 'string' && header.length <= 64) return header.trim();
  return req.socket?.remoteAddress ?? '';
}

export function createLocalizationController({
  countryResolver = defaultCountryResolver,
  getClientIp: readClientIp = getClientIp,
} = {}) {
  async function show(req, res) {
    let countryCode = null;
    try {
      countryCode = await countryResolver.resolve(readClientIp(req));
    } catch {
      countryCode = null;
    }

    const acceptedLanguages = parseAcceptLanguage(req.headers?.['accept-language']);
    const locale = resolveLocale({ countryCode, acceptedLanguages });
    res.set('Cache-Control', 'private, no-store');
    return res.json({ ok: true, data: { locale } });
  }

  return { show };
}

export const { show } = createLocalizationController();
