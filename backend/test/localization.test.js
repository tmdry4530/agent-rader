import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalizationController } from '../src/controllers/localization.controller.js';

function createResponse() {
  return {
    headers: {},
    body: null,
    set(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('국가와 브라우저 언어를 판정해 locale 하나만 반환한다', async () => {
  let receivedIp;
  const controller = createLocalizationController({
    countryResolver: { resolve: async (ip) => { receivedIp = ip; return 'KR'; } },
    getClientIp: () => '8.8.8.8',
  });
  const res = createResponse();

  await controller.show({ headers: { 'accept-language': 'en-US,en;q=0.9' } }, res);

  assert.equal(receivedIp, '8.8.8.8');
  assert.deepEqual(res.body, { ok: true, data: { locale: 'ko' } });
  assert.equal(res.headers['cache-control'], 'private, no-store');
  assert.equal(JSON.stringify(res.body).includes('KR'), false);
  assert.equal(JSON.stringify(res.body).includes('8.8.8.8'), false);
});

test('국가 조회 실패는 API 오류가 아니라 브라우저 언어로 대체한다', async () => {
  const controller = createLocalizationController({
    countryResolver: { resolve: async () => { throw new Error('provider failed'); } },
    getClientIp: () => '1.1.1.1',
  });
  const res = createResponse();

  await controller.show({ headers: { 'accept-language': 'ko-KR,ko;q=0.9' } }, res);

  assert.deepEqual(res.body, { ok: true, data: { locale: 'ko' } });
});

test('국가와 브라우저 언어를 알 수 없으면 영어를 반환한다', async () => {
  const controller = createLocalizationController({
    countryResolver: { resolve: async () => null },
    getClientIp: () => '',
  });
  const res = createResponse();

  await controller.show({ headers: {} }, res);

  assert.deepEqual(res.body, { ok: true, data: { locale: 'en' } });
});
