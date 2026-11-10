import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { FiscalAuditEvent } from './audit-events';
import type { FiscalPurpose } from './contracts';
import { LocalSyntheticGrantStore, type TrustedAuthorizationGrant } from './grant-store';
import { createLocalFiscalHttpServer } from './http-server';
import { callLocalFiscalService } from './internal-client';
import { createIsolatedFiscalService } from './isolated-fiscal-service';
import { InMemoryAtomicNonceStore, type NonceStore } from './nonce-store';
import { issueSyntheticServiceToken, SyntheticServiceIdentityVerifier } from './service-auth';
import { blockRealNfseTransmission } from '../../src/lib/nfse/domain';

const secret = Buffer.from('synthetic-test-secret-with-at-least-32-bytes');
const now = 1_800_000_000;
const audience = 'prosperare-fiscal-local';
const subject = 'prosperare-backend-local';
const purpose: FiscalPurpose = 'VALIDAR_CREDENCIAL_SINTETICA';

function fixture(overrides: {
  tokenAudience?: string;
  tokenSubject?: string;
  tokenExpiresAt?: number;
  expectedIssuer?: string;
  grant?: Partial<TrustedAuthorizationGrant> | null;
  revokeGrant?: boolean;
  nonceStore?: NonceStore;
  grantStoreFailure?: boolean;
  credentialExists?: boolean;
  credentialFailure?: boolean;
  environment?: string;
} = {}) {
  const nonce = randomUUID();
  const grantId = 'grant-1';
  const tokenSubject = overrides.tokenSubject || subject;
  const token = issueSyntheticServiceToken({
    subject: tokenSubject,
    audience: overrides.tokenAudience || audience,
    purpose,
    grantId,
    nonce,
    issuedAt: now - 1,
    expiresAt: overrides.tokenExpiresAt ?? now + 60,
  }, secret);
  const defaultGrant: TrustedAuthorizationGrant = {
    id: grantId,
    actorUid: 'employee-1',
    actorProfile: 'FUNCIONARIO_FISCAL',
    companyId: 'company-1',
    permissions: [purpose],
    issuedToServiceSubject: tokenSubject,
    boundNonce: nonce,
    expiresAt: now + 60,
  };
  const localGrantStore = new LocalSyntheticGrantStore();
  if (overrides.grant !== null) {
    localGrantStore.issueFromTrustedComponent({ ...defaultGrant, ...overrides.grant });
    if (overrides.revokeGrant) localGrantStore.revokeFromTrustedComponent(grantId, now - 1);
  }
  const audits: FiscalAuditEvent[] = [];
  const handler = createIsolatedFiscalService({
    environment: overrides.environment || 'test',
    audience,
    identityVerifier: new SyntheticServiceIdentityVerifier({
      secret,
      expectedIssuer: overrides.expectedIssuer || 'prosperare-local-synthetic-authority',
      allowedSubjects: new Set([subject]),
    }),
    nonceStore: overrides.nonceStore || new InMemoryAtomicNonceStore(),
    grantStore: overrides.grantStoreFailure ? {
      findById: async () => { throw new Error('synthetic datastore unavailable'); },
    } : localGrantStore,
    nowEpochSeconds: () => now,
    credentialExists: async () => {
      if (overrides.credentialFailure) throw new Error('sensitive infrastructure details');
      return overrides.credentialExists ?? true;
    },
    audit: { record: (event) => { audits.push(event); } },
  });
  const request = {
    companyId: 'company-1', credentialId: 'credential-1', purpose, correlationId: randomUUID(),
  };
  const invoke = (body: Record<string, unknown> = request, auth = token, headers: Record<string, string> = {}) => handler({
    headers: { 'x-prosperare-internal-auth': auth, ...headers },
    rawBody: JSON.stringify(body),
  });
  return { handler, token, request, invoke, audits, nonce, localGrantStore };
}

function errorCode(result: Awaited<ReturnType<ReturnType<typeof createIsolatedFiscalService>>>): string | undefined {
  return result.body.success ? undefined : result.body.code;
}

test('identidade autorizada comunica por HTTP e gera auditoria estruturada', async () => {
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
    assert.deepEqual(f.audits.map((event) => event.type), [
      'AUTHENTICATION_PERMITTED', 'GRANT_VALID', 'SYNTHETIC_OPERATION_AUTHORIZED',
    ]);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('rejeita autenticação ausente, inválida e originada do navegador', async (t) => {
  await t.test('ausente', async () => assert.equal(errorCode(await fixture().invoke(undefined, '')), 'AUTHENTICATION_REQUIRED'));
  await t.test('inválida', async () => {
    const f = fixture();
    assert.equal(errorCode(await f.invoke(undefined, `${f.token}tampered`)), 'AUTHENTICATION_INVALID');
  });
  await t.test('navegador', async () => {
    const f = fixture();
    assert.equal(errorCode(await f.invoke(undefined, f.token, { origin: 'https://example.test' })), 'AUTHENTICATION_INVALID');
  });
});

test('rejeita identidade não autorizada', async () => {
  assert.equal(errorCode(await fixture({ tokenSubject: 'unknown-service' }).invoke()), 'IDENTITY_NOT_ALLOWED');
});

test('rejeita audience incorreta', async () => {
  assert.equal(errorCode(await fixture({ tokenAudience: 'wrong-audience' }).invoke()), 'AUDIENCE_MISMATCH');
});

test('rejeita issuer incorreto', async () => {
  assert.equal(errorCode(await fixture({ expectedIssuer: 'wrong-issuer' }).invoke()), 'AUTHENTICATION_INVALID');
});

test('rejeita token expirado', async () => {
  assert.equal(errorCode(await fixture({ tokenExpiresAt: now }).invoke()), 'AUTHENTICATION_EXPIRED');
});

test('rejeita grant expirado com evento específico', async () => {
  const f = fixture({ grant: { expiresAt: now } });
  assert.equal(errorCode(await f.invoke()), 'GRANT_EXPIRED');
  assert.equal(f.audits.at(-1)?.type, 'GRANT_EXPIRED');
});

test('rejeita grant revogado com evento específico', async () => {
  const f = fixture({ revokeGrant: true });
  assert.equal(errorCode(await f.invoke()), 'GRANT_REVOKED');
  assert.equal(f.audits.at(-1)?.type, 'GRANT_REVOKED');
});

test('rejeita empresa divergente e preserva isolamento multiempresa', async () => {
  const f = fixture();
  const result = await f.invoke({ ...f.request, companyId: 'company-2' });
  assert.equal(errorCode(result), 'COMPANY_SCOPE_MISMATCH');
  assert.equal(f.audits.at(-1)?.type, 'COMPANY_MISMATCH');
});

test('rejeita perfil CLIENTE e permissão ausente', async (t) => {
  await t.test('cliente', async () => {
    assert.equal(errorCode(await fixture({ grant: { actorProfile: 'CLIENTE' } }).invoke()), 'AUTHORIZATION_DENIED');
  });
  await t.test('sem permissão', async () => {
    assert.equal(errorCode(await fixture({ grant: { permissions: [] } }).invoke()), 'AUTHORIZATION_DENIED');
  });
});

test('não aceita permissões autodeclaradas no corpo HTTP', async () => {
  const f = fixture({ grant: { permissions: [] } });
  const result = await f.invoke({ ...f.request, permissions: [purpose], actorProfile: 'ADMINISTRADOR_FISCAL' });
  assert.equal(errorCode(result), 'INVALID_REQUEST');
});

test('grant é vinculado ao subject e nonce confiáveis', async (t) => {
  await t.test('subject divergente', async () => {
    const f = fixture({ grant: { issuedToServiceSubject: 'other-service' } });
    assert.equal(errorCode(await f.invoke()), 'AUTHORIZATION_DENIED');
  });
  await t.test('nonce divergente', async () => {
    const f = fixture({ grant: { boundNonce: randomUUID() } });
    assert.equal(errorCode(await f.invoke()), 'AUTHORIZATION_DENIED');
  });
});

test('registro atômico rejeita replay concorrente', async () => {
  const f = fixture();
  const results = await Promise.all(Array.from({ length: 12 }, () => f.invoke()));
  assert.equal(results.filter((result) => result.status === 200).length, 1);
  assert.equal(results.filter((result) => errorCode(result) === 'REQUEST_REPLAYED').length, 11);
  assert.equal(f.audits.filter((event) => event.type === 'REPLAY_DETECTED').length, 11);
  assert.equal(JSON.stringify(f.audits).includes(f.nonce), false);
});

test('nonce store aplica TTL e permite novo registro após expiração', async () => {
  const store = new InMemoryAtomicNonceStore();
  assert.equal(await store.registerOnce('nonce', now + 5, now), 'REGISTERED');
  assert.equal(await store.registerOnce('nonce', now + 5, now + 1), 'REPLAYED');
  assert.equal(await store.registerOnce('nonce', now + 10, now + 5), 'REGISTERED');
});

test('falha do nonce store fecha o acesso e audita infraestrutura', async () => {
  const f = fixture({ nonceStore: { registerOnce: async () => { throw new Error('datastore down'); } } });
  const result = await f.invoke();
  assert.equal(result.status, 503);
  assert.equal(errorCode(result), 'SERVICE_UNAVAILABLE');
  assert(f.audits.some((event) => event.type === 'INFRASTRUCTURE_FAILURE' && event.component === 'NONCE_STORE'));
});

test('falhas de grant e credencial fecham o acesso sem vazar detalhes', async (t) => {
  await t.test('grant store', async () => {
    const result = await fixture({ grantStoreFailure: true }).invoke();
    assert.equal(errorCode(result), 'SERVICE_UNAVAILABLE');
  });
  await t.test('credential store', async () => {
    const result = await fixture({ credentialFailure: true }).invoke();
    assert.equal(errorCode(result), 'SERVICE_UNAVAILABLE');
    assert.equal(JSON.stringify(result).includes('sensitive infrastructure details'), false);
  });
});

test('credencial sintética inexistente retorna erro sanitizado', async () => {
  assert.equal(errorCode(await fixture({ credentialExists: false }).invoke()), 'CREDENTIAL_NOT_FOUND');
});

test('cliente converte timeout e indisponibilidade em erros sanitizados', async (t) => {
  await t.test('timeout', async () => {
    const f = fixture();
    const result = await callLocalFiscalService({
      baseUrl: 'http://unused.test', token: f.token, request: f.request, timeoutMs: 5,
      fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }),
    });
    assert.equal(result.success ? undefined : result.code, 'SERVICE_TIMEOUT');
  });
  await t.test('indisponível', async () => {
    const f = fixture();
    const result = await callLocalFiscalService({
      baseUrl: 'http://unused.test', token: f.token, request: f.request, timeoutMs: 50,
      fetchImpl: async () => { throw new Error('sensitive network details'); },
    });
    assert.equal(result.success ? undefined : result.code, 'SERVICE_UNAVAILABLE');
    assert.equal(JSON.stringify(result).includes('sensitive network details'), false);
  });
});

test('auditoria nunca registra token, segredo ou nonce bruto', async () => {
  const f = fixture();
  await f.invoke();
  const serialized = JSON.stringify(f.audits);
  assert.equal(serialized.includes(f.token), false);
  assert.equal(serialized.includes(secret.toString()), false);
  assert.equal(serialized.includes(f.nonce), false);
});

test('serviço e servidor permanecem bloqueados em produção', () => {
  assert.throws(() => fixture({ environment: 'production' }), /bloqueado em produção/i);
  assert.throws(() => createLocalFiscalHttpServer(async () => ({
    status: 200, body: { success: false, code: 'PRODUCTION_BLOCKED', message: 'blocked' },
  }), 'production'), /bloqueado em produção/i);
});

test('bloqueios HTTP 503 de emissão e upload permanecem presentes', () => {
  assert.equal(blockRealNfseTransmission().status, 503);
  const uploadRoute = readFileSync('src/app/api/fiscal/credenciais/route.ts', 'utf8');
  assert.match(uploadRoute, /\{ status: 503 \}/);
  assert.match(uploadRoute, /upload de certificados permanecem desabilitados/i);
});
