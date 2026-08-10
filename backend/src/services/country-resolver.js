import { createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { WebServiceClient } from '@maxmind/geoip2-node';

const COUNTRY_CODE = /^[A-Z]{2}$/;

function isPrivateIpv4(ipAddress) {
  const [a, b] = ipAddress.split('.').map(Number);
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224;
}

export function isPublicIp(ipAddress) {
  const version = isIP(ipAddress);
  if (version === 4) return !isPrivateIpv4(ipAddress);
  if (version !== 6) return false;

  const value = ipAddress.toLowerCase();
  if (value.startsWith('::ffff:')) return isPublicIp(value.slice(7));
  return value !== '::'
    && value !== '::1'
    && !value.startsWith('fc')
    && !value.startsWith('fd')
    && !/^fe[89ab]/.test(value)
    && !value.startsWith('ff')
    && !value.startsWith('2001:db8:');
}

function normalizeCountryCode(value) {
  if (typeof value !== 'string') return null;
  const code = value.toUpperCase();
  return COUNTRY_CODE.test(code) ? code : null;
}

export function createCountryResolver({
  lookup,
  now = () => Date.now(),
  ttlMs = 10 * 60 * 1000,
  maxEntries = 5_000,
  cacheKey = randomBytes(32),
}) {
  const cache = new Map();
  const inFlight = new Map();

  function cacheId(ipAddress) {
    return createHmac('sha256', cacheKey).update(ipAddress).digest('hex');
  }

  function store(key, countryCode) {
    const currentTime = now();
    for (const [cachedKey, entry] of cache) {
      if (entry.expiresAt <= currentTime) cache.delete(cachedKey);
    }
    while (cache.size >= maxEntries) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, { countryCode, expiresAt: currentTime + ttlMs });
  }

  async function resolve(ipAddress) {
    if (!isPublicIp(ipAddress)) return null;

    const key = cacheId(ipAddress);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.countryCode;
    if (cached) cache.delete(key);
    if (inFlight.has(key)) return inFlight.get(key);

    const pending = Promise.resolve()
      .then(() => lookup(ipAddress))
      .then(normalizeCountryCode)
      .catch(() => null)
      .then((countryCode) => {
        store(key, countryCode);
        return countryCode;
      })
      .finally(() => inFlight.delete(key));

    inFlight.set(key, pending);
    return pending;
  }

  return { resolve };
}

export function createMaxMindCountryResolver(env = process.env) {
  const accountId = env.MAXMIND_ACCOUNT_ID;
  const licenseKey = env.MAXMIND_LICENSE_KEY;
  if (!accountId || !licenseKey) {
    return createCountryResolver({ lookup: async () => null });
  }

  const client = new WebServiceClient(accountId, licenseKey, {
    host: 'geolite.info',
    timeout: 800,
  });
  return createCountryResolver({
    lookup: async (ipAddress) => {
      const response = await client.country(ipAddress);
      return response.country?.isoCode ?? response.registeredCountry?.isoCode ?? null;
    },
  });
}

export const countryResolver = createMaxMindCountryResolver();
