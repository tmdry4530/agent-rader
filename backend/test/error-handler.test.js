import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler, httpError } from '../src/middleware/errorHandler.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function captureErrorLog(callback) {
  const original = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  try {
    callback();
  } finally {
    console.error = original;
  }
  return logs;
}

test('알려진 오류는 코드에 맞는 쉬운 문구만 응답한다', () => {
  const res = response();
  const logs = captureErrorLog(() => {
    errorHandler(
      httpError(400, 'VALIDATION_ERROR', 'query_id=secret-internal-value'),
      {},
      res,
      () => {},
    );
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    ok: false,
    error: { code: 'VALIDATION_ERROR', message: '입력한 내용을 확인해 주세요.' },
  });
  assert.doesNotMatch(JSON.stringify(logs), /secret-internal-value/);
});

test('예상하지 못한 오류의 내부 메시지는 응답하지 않는다', () => {
  const res = response();
  const logs = captureErrorLog(() => {
    errorHandler(new Error('database password leaked'), {}, res, () => {});
  });

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
  });
  assert.doesNotMatch(JSON.stringify(logs), /database password leaked/);
});
