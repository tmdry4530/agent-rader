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
  const controller = createLocalizationController();
  const res = createResponse();

  await controller.show({
    headers: {
      'cf-ipcountry': 'KR',
      'accept-language': 'en-US,en;q=0.9',
    },
  }, res);

  assert.deepEqual(res.body, { ok: true, data: { locale: 'ko' } });
  assert.equal(res.headers['cache-control'], 'private, no-store');
  assert.equal(JSON.stringify(res.body).includes('KR'), false);
});

test('유효한 Cloudflare 국가가 브라우저 언어보다 우선한다', async () => {
  const controller = createLocalizationController();
  const res = createResponse();

  await controller.show({
    headers: {
      'cf-ipcountry': 'US',
      'accept-language': 'ko-KR,ko;q=0.9',
    },
  }, res);

  assert.deepEqual(res.body, { ok: true, data: { locale: 'en' } });
});

test('소문자·공백 국가는 정규화하고 특수·잘못된 코드는 브라우저 언어로 대체한다', async () => {
  for (const countryCode of ['kr', ' KR ']) {
    const controller = createLocalizationController();
    const res = createResponse();

    await controller.show({
      headers: {
        'cf-ipcountry': countryCode,
        'accept-language': 'en-US,en;q=0.9',
      },
    }, res);

    assert.deepEqual(res.body, { ok: true, data: { locale: 'ko' } }, countryCode);
  }
});

test('특수·잘못된 Cloudflare 국가는 브라우저 언어로 대체한다', async () => {
  const invalidCountryCodes = ['XX', 'T1', 'USA', ''];

  for (const countryCode of invalidCountryCodes) {
    const controller = createLocalizationController();
    const res = createResponse();

    await controller.show({
      headers: {
        'cf-ipcountry': countryCode,
        'accept-language': 'ko-KR,ko;q=0.9',
      },
    }, res);

    assert.deepEqual(res.body, { ok: true, data: { locale: 'ko' } }, countryCode);
  }
});

test('Cloudflare 국가와 브라우저 언어를 알 수 없으면 영어를 반환한다', async () => {
  const controller = createLocalizationController();
  const res = createResponse();

  await controller.show({ headers: {} }, res);

  assert.deepEqual(res.body, { ok: true, data: { locale: 'en' } });
});
