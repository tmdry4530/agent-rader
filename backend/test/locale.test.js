import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAcceptLanguage, resolveLocale } from '../src/utils/locale.js';

test('한국 접속자는 브라우저가 영어여도 국가 기본값인 한국어를 사용한다', () => {
  assert.equal(resolveLocale({ countryCode: 'KR', acceptedLanguages: ['en'] }), 'ko');
});

test('한국 외 접속자는 브라우저가 한국어여도 국가 기본값인 영어를 사용한다', () => {
  assert.equal(resolveLocale({ countryCode: 'US', acceptedLanguages: ['ko'] }), 'en');
});

test('국가를 알 수 없으면 브라우저의 첫 지원 언어를 사용한다', () => {
  assert.equal(resolveLocale({ countryCode: null, acceptedLanguages: ['ja', 'ko', 'en'] }), 'ko');
  assert.equal(resolveLocale({ countryCode: null, acceptedLanguages: ['ja'] }), 'en');
});

test('Accept-Language는 q 우선순위와 지역 태그를 정규화한다', () => {
  assert.deepEqual(parseAcceptLanguage('ja-JP;q=0.5, en-US;q=0.8, ko-KR;q=0.9'), ['ko', 'en', 'ja']);
});

test('잘못된 q 값과 와일드카드는 무시한다', () => {
  assert.deepEqual(parseAcceptLanguage('ko;q=2, en;q=0.8, *;q=0.9, ja;q=nope'), ['en']);
});

test('Accept-Language는 10개 항목까지만 처리한다', () => {
  const header = 'aa,bb,cc,dd,ee,ff,gg,hh,ii,jj,ko';
  assert.equal(parseAcceptLanguage(header).includes('ko'), false);
});

test('지나치게 긴 헤더와 비문자 입력도 안전하게 처리한다', () => {
  assert.deepEqual(parseAcceptLanguage(`en,${'x'.repeat(600)},ko`), ['en']);
  assert.deepEqual(parseAcceptLanguage(null), []);
});
