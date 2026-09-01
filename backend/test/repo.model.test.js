import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRisingQuery, buildTrendsQuery } from '../src/models/repo.model.js';

test('신생 급상승 쿼리 — 24시간 500스타 증가·15일 필터를 적용한다', () => {
  const { sql, params } = buildRisingQuery(42, {
    windowDays: 15,
    minDelta: 500,
    limit: 8,
  });

  const compactSql = sql.replace(/\s+/g, ' ').trim();
  assert.match(compactSql, /s\.captured_at <= DATE_SUB\(NOW\(\), INTERVAL 24 HOUR\)/);
  assert.match(compactSql, /ORDER BY s\.captured_at DESC, s\.id DESC LIMIT 1/);
  assert.match(compactSql, /r\.stars - baseline\.stars >= \?/);
  assert.match(compactSql, /ORDER BY star_delta_24h DESC, growth_rate_24h DESC/);
  assert.deepEqual(params, [42, 15, 500, 8]);
});

test('빠르게 성장 중 쿼리 — 1,000스타 이상만 증가율로 정렬한다', () => {
  const { sql, params } = buildTrendsQuery(42, 10);
  assert.match(sql, /stars >= 1000 AND star_delta > 0 ORDER BY growth_rate DESC/);
  assert.deepEqual(params, [42, 10]);
});
