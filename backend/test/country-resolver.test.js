import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCountryResolver, isPublicIp } from '../src/services/country-resolver.js';

test('공개 IP의 국가 코드만 대문자 ISO 형식으로 반환한다', async () => {
  const resolver = createCountryResolver({ lookup: async () => 'kr' });
  assert.equal(await resolver.resolve('8.8.8.8'), 'KR');
});

test('사설·루프백·잘못된 IP는 외부 조회를 하지 않는다', async () => {
  let calls = 0;
  const resolver = createCountryResolver({ lookup: async () => { calls++; return 'KR'; } });

  assert.equal(await resolver.resolve('127.0.0.1'), null);
  assert.equal(await resolver.resolve('10.0.0.1'), null);
  assert.equal(await resolver.resolve('192.168.1.2'), null);
  assert.equal(await resolver.resolve('::1'), null);
  assert.equal(await resolver.resolve('not-an-ip'), null);
  assert.equal(calls, 0);
});

test('공개 IPv4와 IPv6만 허용한다', () => {
  assert.equal(isPublicIp('8.8.8.8'), true);
  assert.equal(isPublicIp('2606:4700:4700::1111'), true);
  assert.equal(isPublicIp('172.16.0.1'), false);
  assert.equal(isPublicIp('169.254.1.1'), false);
  assert.equal(isPublicIp('fc00::1'), false);
  assert.equal(isPublicIp('fe80::1'), false);
});

test('외부 오류와 비정상 국가 코드는 null로 정규화한다', async () => {
  const broken = createCountryResolver({ lookup: async () => { throw new Error('secret response'); } });
  const invalid = createCountryResolver({ lookup: async () => 'KOR' });

  assert.equal(await broken.resolve('1.1.1.1'), null);
  assert.equal(await invalid.resolve('1.0.0.1'), null);
});

test('같은 IP의 동시 요청과 TTL 내 반복 요청은 외부 조회 한 번을 공유한다', async () => {
  let calls = 0;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const resolver = createCountryResolver({
    lookup: async () => { calls++; await pending; return 'US'; },
    now: () => 100,
  });

  const first = resolver.resolve('8.8.4.4');
  const second = resolver.resolve('8.8.4.4');
  release();

  assert.deepEqual(await Promise.all([first, second]), ['US', 'US']);
  assert.equal(await resolver.resolve('8.8.4.4'), 'US');
  assert.equal(calls, 1);
});

test('캐시 TTL이 지나면 국가를 다시 조회한다', async () => {
  let calls = 0;
  let currentTime = 0;
  const resolver = createCountryResolver({
    lookup: async () => { calls++; return 'US'; },
    now: () => currentTime,
    ttlMs: 10,
  });

  await resolver.resolve('9.9.9.9');
  currentTime = 11;
  await resolver.resolve('9.9.9.9');
  assert.equal(calls, 2);
});
