import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRisingQuery } from '../src/models/repo.model.js';

test('신생 급상승 쿼리 — 24시간 기준선·500스타·30일 필터를 적용한다', () => {
  const { sql, params } = buildRisingQuery(42, {
    windowDays: 30,
    minStars: 500,
    limit: 8,
  });

  const compactSql = sql.replace(/\s+/g, ' ').trim();
  assert.match(compactSql, /s\.captured_at <= DATE_SUB\(NOW\(\), INTERVAL 24 HOUR\)/);
  assert.match(compactSql, /ORDER BY s\.captured_at DESC, s\.id DESC LIMIT 1/);
  assert.match(compactSql, /r\.stars >= \?/);
  assert.match(compactSql, /r\.stars > baseline\.stars/);
  assert.match(compactSql, /ORDER BY star_delta_24h DESC, growth_rate_24h DESC/);
  assert.deepEqual(params, [42, 500, 30, 8]);
});
