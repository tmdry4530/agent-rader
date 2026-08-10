import assert from 'node:assert/strict';
import test from 'node:test';
import app from '../src/app.js';

async function requestHealth(headers = {}) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const address = server.address();
    return await fetch(`http://127.0.0.1:${address.port}/api/health`, { headers });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('API 응답에 브라우저 보안 헤더를 설정한다', async () => {
  const response = await requestHealth();

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('strict-transport-security') ?? '', /^max-age=/);

  const policy = response.headers.get('content-security-policy') ?? '';
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /connect-src 'self'/);
  assert.match(policy, /frame-ancestors 'none'/);
});

test('신뢰하지 않는 출처에 CORS 허용 헤더를 보내지 않는다', async () => {
  const response = await requestHealth({ Origin: 'https://attacker.example' });

  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
