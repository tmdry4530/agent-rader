const DEFAULT_MIN_STARS = Number(process.env.ETL_MIN_STARS) || 0;

// GitHub Search per_page 상한이 100 — 단일 요청으로 최대 100까지. 기본 100, 100 초과는 클램프.
export function perPage() {
  return Math.min(Number(process.env.ETL_PER_QUERY) || 100, 100);
}

export async function extractRepos(wq, octokit, { minStars, createdAfter } = {}) {
  const effectiveMinStars = minStars === undefined ? DEFAULT_MIN_STARS : minStars;
  let q = wq.query_type === 'topic'
    ? `topic:${wq.query}`
    : `${wq.query} in:name,description,readme`;
  if (createdAfter) q += ` created:>${createdAfter}`;
  if (effectiveMinStars > 0) q += ` stars:>=${effectiveMinStars}`;
  const res = await octokit.rest.search.repos({ q, sort: 'stars', order: 'desc', per_page: perPage() });
  return res.data.items;
}
