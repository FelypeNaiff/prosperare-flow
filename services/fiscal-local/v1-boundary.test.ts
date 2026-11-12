import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { acceptLocalFiscalCommandV1 } from './v1-boundary';

const now = 1_800_000_000;
const ids = {
  operation: '11111111-1111-4111-8111-111111111111',
  correlation: '22222222-2222-4222-8222-222222222222',
  nonce: '33333333-3333-4333-8333-333333333333',
};

function command(overrides: Record<string, unknown> = {}) {
  return {
    contractVersion: '1.0', operationId: ids.operation, operation: 'VALIDATE_CREDENTIAL',
    correlationId: ids.correlation, idempotencyKey: 'idem-validate-credential-0001',
    companyId: 'company-1', grantId: 'grant-1', nonceId: ids.nonce,
    payload: { credentialId: 'credential-1' }, ...overrides,
  };
}

const identity = {
  issuer: 'https://accounts.example.test', audience: 'prosperare-fiscal',
  subject: 'flow-service', issuedAt: now - 10, expiresAt: now + 60,
};
const grant = {
  grantId: 'grant-1', actorId: 'employee-1', companyId: 'company-1',
  operation: 'VALIDATE_CREDENTIAL', issuedToServiceSubject: 'flow-service',
  nonceId: ids.nonce, issuedAt: now - 10, expiresAt: now + 60,
};

function accept(overrides: Partial<Parameters<typeof acceptLocalFiscalCommandV1>[0]> = {}) {
  return acceptLocalFiscalCommandV1({
    networkCommand: command(), verifiedIdentity: identity, trustedGrant: grant,
    nowEpochSeconds: now, ...overrides,
  });
}

test('converte comando V1 validado para a operação sintética local', () => {
  assert.deepEqual(accept(), {
    accepted: true,
    request: {
      companyId: 'company-1', credentialId: 'credential-1',
      purpose: 'VALIDAR_CREDENCIAL_SINTETICA', correlationId: ids.correlation,
    },
  });
});

test('rejeita versão, payload e campos inesperados', () => {
  assert.deepEqual(accept({ networkCommand: command({ contractVersion: '2.0' }) }), {
    accepted: false, code: 'INVALID_REQUEST',
  });
  assert.deepEqual(accept({ networkCommand: command({ payload: { credentialId: 'credential-1', extra: true } }) }), {
    accepted: false, code: 'INVALID_REQUEST',
  });
});

test('JSON do cliente não pode fabricar identidade ou grant confiável', () => {
  assert.deepEqual(accept({ networkCommand: command({ identity, grant }) }), {
    accepted: false, code: 'INVALID_REQUEST',
  });
});

test('preserva vínculos de empresa, operação, subject, grant e nonce', () => {
  assert.deepEqual(accept({ networkCommand: command({ companyId: 'company-2' }) }), {
    accepted: false, code: 'COMPANY_SCOPE_MISMATCH',
  });
  assert.deepEqual(accept({ trustedGrant: { ...grant, issuedToServiceSubject: 'other-service' } }), {
    accepted: false, code: 'AUTHORIZATION_DENIED',
  });
  assert.deepEqual(accept({ networkCommand: command({ nonceId: '44444444-4444-4444-8444-444444444444' }) }), {
    accepted: false, code: 'NONCE_MISMATCH',
  });
});

test('mantém operações de emissão bloqueadas na fronteira local', () => {
  const result = accept({
    networkCommand: command({ operation: 'PREPARE_NFSE' }),
    trustedGrant: { ...grant, operation: 'PREPARE_NFSE' },
  });
  assert.deepEqual(result, { accepted: false, code: 'PRODUCTION_BLOCKED' });
});

test('fronteira e serviço não importam módulos internos do FLOW ou frameworks', () => {
  for (const file of [
    'services/fiscal-local/v1-boundary.ts',
    'services/fiscal-local/isolated-fiscal-service.ts',
  ]) {
    const source = readFileSync(file, 'utf8');
    for (const forbidden of ['src/', '@/','next/', 'react', 'firebase', 'firestore']) {
      assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, `${file}: ${forbidden}`);
    }
  }
});
