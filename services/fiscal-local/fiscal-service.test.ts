import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import test from 'node:test';

import { callLocalFiscalService } from './internal-client';
import { createLocalFiscalHttpServer } from './http-server';
import { createIsolatedFiscalService, type FiscalAuditEntry, type TrustedAuthorizationGrant } from './isolated-fiscal-service';
import { issueSyntheticServiceToken } from './service-auth';
import { blockRealNfseTransmission } from '../../src/lib/nfse/domain';

const secret = Buffer.from('synthetic-test-secret-with-at-least-32-bytes');
const now = 1_800_000_000;
const audience = 'prosperare-fiscal-local';

function fixture(overrides?: {
  grant?: TrustedAuthorizationGrant | null;
  credentialExists?: boolean;
  subject?: string;
  tokenAudience?: string;
  expiresAt?: number;
  environment?: string;
  credentialFailure?: boolean;
}) {
  const audits: FiscalAuditEntry[] = [];
  const logs: Record<string, unknown>[] = [];
  const grant = overrides && 'grant' in overrides ? overrides.grant : {
    id: 'grant-1',
    actorUid: 'employee-1',
    actorType: 'FUNCIONARIO' as const,
    active: true,
    companyId: 'company-1',
    allowedPurposes: ['VALIDAR_CREDENCIAL_SINTETICA'] as const,
  };
  const handler = createIsolatedFiscalService({
    environment: overrides?.environment || 'test',
    audience,
    allowedServiceIdentities: new Set(['prosperare-backend-local']),
    syntheticSigningSecret: secret,
    nowEpochSeconds: () => now,
    findGrant: async (id) => grant?.id === id ? grant : null,
    credentialExists: async () => {
      if (overrides?.credentialFailure) throw new Error('internal details must not escape');
      return overrides?.credentialExists ?? true;
    },
    recordAudit: (entry) => { audits.push(entry); },
    recordLog: (entry) => { logs.push(entry); },
  });
  const token = issueSyntheticServiceToken({
    subject: overrides?.subject || 'prosperare-backend-local',
    audience: overrides?.tokenAudience || audience,
    purpose: 'VALIDAR_CREDENCIAL_SINTETICA',
    grantId: 'grant-1',
    nonce: randomUUID(),
    issuedAt: now - 1,
    expiresAt: overrides?.expiresAt ?? now + 60,
  }, secret);
  const request = {
    companyId: 'company-1',
    credentialId: 'credential-1',
    purpose: 'VALIDAR_CREDENCIAL_SINTETICA' as const,
    correlationId: randomUUID(),
  };
  const invoke = (input = request, auth = token, headers: Record<string, string> = {}) => handler({
    headers: { 'x-prosperare-internal-auth': auth, ...headers },
    rawBody: JSON.stringify(input),
  });
  return { handler, token, request, invoke, audits, logs };
}

test('comunicação HTTP local autorizada retorna somente resultado sanitizado', async () => {
  const f = fixture();
  const server = createLocalFiscalHttpServer(f.handler, 'test');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    const result = await callLocalFiscalService({
      baseUrl: `http://127.0.0.1:${address.port}`,
      token: f.token,
      request: f.request,
      timeoutMs: 1_000,
    });
    assert.equal(result.success, true);
    assert.equal(JSON.stringify(result).includes('secret'), false);
    assert.equal(f.audits[0]?.result, 'PERMITIDO');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('rejeita ausência de autenticação', async () => {
  const f = fixture();
  const result = await f.invoke(f.request, '');
  assert.equal(result.status, 401);
  assert.equal(result.body.success || result.body.code, 'AUTHENTICATION_REQUIRED');
});

test('rejeita token inválido', async () => {
  const f = fixture();
  const result = await f.invoke(f.request, `${f.token}tampered`);
  assert.equal(result.body.success || result.body.code, 'AUTHENTICATION_INVALID');
});

test('rejeita token expirado', async () => {
  const result = await fixture({ expiresAt: now }).invoke();
  assert.equal(result.body.success || result.body.code, 'AUTHENTICATION_EXPIRED');
});

test('rejeita destinatário incorreto', async () => {
  const result = await fixture({ tokenAudience: 'outro-servico' }).invoke();
  assert.equal(result.body.success || result.body.code, 'AUDIENCE_MISMATCH');
});

test('rejeita identidade de serviço não autorizada', async () => {
  const result = await fixture({ subject: 'browser-or-unknown-service' }).invoke();
  assert.equal(result.body.success || result.body.code, 'IDENTITY_NOT_ALLOWED');
});

test('rejeita sinais de chamada originada pelo navegador', async () => {
  const f = fixture();
  const result = await f.invoke(f.request, f.token, { origin: 'https://example.test', 'sec-fetch-site': 'cross-site' });
  assert.equal(result.body.success || result.body.code, 'AUTHENTICATION_INVALID');
});

test('rejeita empresa divergente do grant confiável', async () => {
  const f = fixture();
  const result = await f.invoke({ ...f.request, companyId: 'company-2' });
  assert.equal(result.body.success || result.body.code, 'COMPANY_SCOPE_MISMATCH');
});

test('rejeita credencial sintética inexistente', async () => {
  const result = await fixture({ credentialExists: false }).invoke();
  assert.equal(result.status, 404);
  assert.equal(result.body.success || result.body.code, 'CREDENTIAL_NOT_FOUND');
});

test('rejeita usuário CLIENTE em operação interna', async () => {
  const grant: TrustedAuthorizationGrant = {
    id: 'grant-1', actorUid: 'client-1', actorType: 'CLIENTE', active: true,
    companyId: 'company-1', allowedPurposes: ['VALIDAR_CREDENCIAL_SINTETICA'],
  };
  const result = await fixture({ grant }).invoke();
  assert.equal(result.body.success || result.body.code, 'AUTHORIZATION_DENIED');
});

test('rejeita funcionário sem vínculo ativo ou sem permissão', async (t) => {
  await t.test('vínculo inativo', async () => {
    const grant: TrustedAuthorizationGrant = {
      id: 'grant-1', actorUid: 'employee-1', actorType: 'FUNCIONARIO', active: false,
      companyId: 'company-1', allowedPurposes: ['VALIDAR_CREDENCIAL_SINTETICA'],
    };
    assert.equal((await fixture({ grant }).invoke()).body.success, false);
  });
  await t.test('permissão ausente', async () => {
    const grant: TrustedAuthorizationGrant = {
      id: 'grant-1', actorUid: 'employee-1', actorType: 'FUNCIONARIO', active: true,
      companyId: 'company-1', allowedPurposes: [],
    };
    assert.equal((await fixture({ grant }).invoke()).body.success, false);
  });
});

test('falha interna retorna indisponibilidade sanitizada', async () => {
  const result = await fixture({ credentialFailure: true }).invoke();
  assert.equal(result.status, 503);
  assert.deepEqual(result.body.success ? null : result.body.code, 'SERVICE_UNAVAILABLE');
  assert.equal(JSON.stringify(result.body).includes('internal details'), false);
});

test('cliente converte timeout em erro sanitizado', async () => {
  const f = fixture();
  const result = await callLocalFiscalService({
    baseUrl: 'http://unused.test', token: f.token, request: f.request, timeoutMs: 5,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }),
  });
  assert.equal(result.success || result.code, 'SERVICE_TIMEOUT');
});

test('cliente converte indisponibilidade em erro sanitizado', async () => {
  const f = fixture();
  const result = await callLocalFiscalService({
    baseUrl: 'http://unused.test', token: f.token, request: f.request, timeoutMs: 50,
    fetchImpl: async () => { throw new Error('connection refused with sensitive internals'); },
  });
  assert.equal(result.success || result.code, 'SERVICE_UNAVAILABLE');
  assert.equal(JSON.stringify(result).includes('sensitive internals'), false);
});

test('contrato rejeita material externo sensível e logs não contêm segredo', async () => {
  const f = fixture();
  const result = await f.handler({
    headers: { 'x-prosperare-internal-auth': f.token },
    rawBody: JSON.stringify({ ...f.request, password: 'synthetic-super-secret' }),
  });
  assert.equal(result.status, 400);
  assert.equal(JSON.stringify(f.logs).includes('synthetic-super-secret'), false);
  assert.equal(JSON.stringify(f.audits).includes('synthetic-super-secret'), false);
});

test('serviço e servidor são bloqueados em produção', () => {
  assert.throws(() => fixture({ environment: 'production' }), /bloqueado em produção/i);
  assert.throws(() => createLocalFiscalHttpServer(async () => ({
    status: 200,
    body: { success: false, code: 'PRODUCTION_BLOCKED', message: 'blocked' },
  }), 'production'), /bloqueado em produção/i);
});

test('nonce impede reutilização da solicitação autenticada', async () => {
  const f = fixture();
  assert.equal((await f.invoke()).status, 200);
  const repeated = await f.invoke();
  assert.equal(repeated.status, 409);
  assert.equal(repeated.body.success || repeated.body.code, 'REQUEST_REPLAYED');
});

test('bloqueios HTTP 503 de emissão e upload permanecem presentes', () => {
  assert.equal(blockRealNfseTransmission().status, 503);
  const uploadRoute = readFileSync('src/app/api/fiscal/credenciais/route.ts', 'utf8');
  assert.match(uploadRoute, /\{ status: 503 \}/);
  assert.match(uploadRoute, /upload de certificados permanecem desabilitados/i);
});
