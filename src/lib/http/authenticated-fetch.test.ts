import assert from 'node:assert/strict';
import test from 'node:test';

import type { User } from 'firebase/auth';

import { authenticatedFetch } from './authenticated-fetch';

function userWithToken(getIdToken: () => Promise<string>): User {
  return { getIdToken } as unknown as User;
}

test('obtém o token e preserva método, corpo e cabeçalhos do consumidor', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let capturedInput: RequestInfo | URL | undefined;
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    capturedInput = input;
    capturedInit = init;
    return new Response(JSON.stringify({ ok: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await authenticatedFetch(
    userWithToken(async () => 'synthetic-id-token'),
    '/api/admin/example',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Correlation-Id': 'synthetic-correlation' },
      body: JSON.stringify({ synthetic: true }),
    },
  );

  assert.equal(capturedInput, '/api/admin/example');
  assert.equal(capturedInit?.method, 'POST');
  assert.equal(capturedInit?.body, JSON.stringify({ synthetic: true }));
  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get('Authorization'), 'Bearer synthetic-id-token');
  assert.equal(headers.get('Content-Type'), 'application/json');
  assert.equal(headers.get('X-Correlation-Id'), 'synthetic-correlation');
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true });
});

test('substitui Authorization fornecido pelo chamador pelo token Firebase', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let authorization: string | null = null;
  globalThis.fetch = async (_input, init) => {
    authorization = new Headers(init?.headers).get('Authorization');
    return new Response(null, { status: 204 });
  };

  await authenticatedFetch(userWithToken(async () => 'trusted-token'), '/api/example', {
    headers: { Authorization: 'Bearer forged-token' },
  });

  assert.equal(authorization, 'Bearer trusted-token');
});

test('propaga falha de autenticação sem executar a requisição HTTP', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response(null, { status: 200 });
  };

  const authenticationError = new Error('synthetic authentication failure');
  await assert.rejects(
    authenticatedFetch(userWithToken(async () => { throw authenticationError; }), '/api/example'),
    (error: unknown) => error === authenticationError,
  );
  assert.equal(fetchCalled, false);
});

test('propaga resposta e falhas de rede sem reinterpretar o contrato HTTP', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  const unavailable = new Response(JSON.stringify({ error: 'indisponível' }), { status: 503 });
  globalThis.fetch = async () => unavailable;
  assert.equal(
    await authenticatedFetch(userWithToken(async () => 'synthetic-token'), '/api/nfse/emitir'),
    unavailable,
  );

  const networkError = new TypeError('synthetic network failure');
  globalThis.fetch = async () => { throw networkError; };
  await assert.rejects(
    authenticatedFetch(userWithToken(async () => 'synthetic-token'), '/api/nfse/emitir'),
    (error: unknown) => error === networkError,
  );
});
