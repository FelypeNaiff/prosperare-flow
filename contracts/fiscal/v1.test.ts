import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FISCAL_CONTRACT_VERSION_V1,
  deserializeFiscalCommandV1,
  deserializeFiscalResponseV1,
  fiscalCommandV1Schema,
  fiscalErrorResponseV1Schema,
  fiscalProcessingStatusV1Schema,
  isFiscalContractVersionCompatibleV1,
  serializeFiscalCommandV1,
  serializeFiscalResponseV1,
  trustedFiscalGrantV1Schema,
  validateFiscalTrustBindingsV1,
  verifiedServiceIdentityV1Schema,
  type FiscalCommandV1,
  type TrustedFiscalGrantV1,
  type VerifiedServiceIdentityV1,
} from './v1';

const ids = {
  operation: '11111111-1111-4111-8111-111111111111',
  correlation: '22222222-2222-4222-8222-222222222222',
  nonce: '33333333-3333-4333-8333-333333333333',
};

function command(overrides: Partial<FiscalCommandV1> = {}): FiscalCommandV1 {
  return {
    contractVersion: FISCAL_CONTRACT_VERSION_V1,
    operationId: ids.operation,
    operation: 'PREPARE_NFSE',
    correlationId: ids.correlation,
    idempotencyKey: 'synthetic-idempotency-0001',
    companyId: 'company-a',
    grantId: 'grant-a',
    nonceId: ids.nonce,
    payload: { serviceCode: 'synthetic-service', amountInCents: 1000 },
    ...overrides,
  };
}

const identity: VerifiedServiceIdentityV1 = {
  issuer: 'https://accounts.example.test',
  audience: 'https://fiscal.example.test',
  subject: 'flow-service',
  issuedAt: 1_000,
  expiresAt: 1_100,
};

function grant(overrides: Partial<TrustedFiscalGrantV1> = {}): TrustedFiscalGrantV1 {
  return {
    grantId: 'grant-a',
    actorId: 'actor-a',
    companyId: 'company-a',
    operation: 'PREPARE_NFSE',
    issuedToServiceSubject: 'flow-service',
    nonceId: ids.nonce,
    issuedAt: 1_000,
    expiresAt: 1_100,
    ...overrides,
  };
}

test('aceita comando V1 estrito e identificadores obrigatórios', () => {
  assert.deepEqual(fiscalCommandV1Schema.parse(command()), command());
  for (const field of ['operationId', 'correlationId', 'idempotencyKey', 'companyId', 'grantId', 'nonceId'] as const) {
    const invalid = { ...command() } as Record<string, unknown>;
    delete invalid[field];
    assert.equal(fiscalCommandV1Schema.safeParse(invalid).success, false, field);
  }
});

test('rejeita versão, UUID, identificador e campo adicional inválidos', () => {
  assert.equal(fiscalCommandV1Schema.safeParse({ ...command(), contractVersion: '2.0' }).success, false);
  assert.equal(fiscalCommandV1Schema.safeParse({ ...command(), correlationId: 'not-a-uuid' }).success, false);
  assert.equal(fiscalCommandV1Schema.safeParse({ ...command(), idempotencyKey: 'short' }).success, false);
  assert.equal(fiscalCommandV1Schema.safeParse({ ...command(), unexpected: true }).success, false);
  assert.equal(fiscalCommandV1Schema.safeParse({
    ...command(),
    identity,
    grant: grant(),
  }).success, false);
});

test('rejeita permissões e identidades autodeclaradas em qualquer nível do payload', () => {
  for (const payload of [
    { permissions: ['PREPARE_NFSE'] },
    { nested: { role: 'ADMIN' } },
    { items: [{ scopes: ['*'] }] },
    { serviceIdentity: { subject: 'forged-service' } },
  ]) {
    assert.equal(fiscalCommandV1Schema.safeParse(command({ payload })).success, false);
  }
});

test('não confia somente em companyId e exige todos os vínculos confiáveis', () => {
  assert.deepEqual(validateFiscalTrustBindingsV1({
    command: command(), identity, grant: grant(), nowEpochSeconds: 1_050,
  }), { valid: true });

  const cases: Array<[Partial<TrustedFiscalGrantV1>, string]> = [
    [{ companyId: 'company-b' }, 'COMPANY_SCOPE_MISMATCH'],
    [{ operation: 'VALIDATE_CREDENTIAL' }, 'OPERATION_SCOPE_MISMATCH'],
    [{ issuedToServiceSubject: 'other-service' }, 'AUTHORIZATION_DENIED'],
    [{ nonceId: '44444444-4444-4444-8444-444444444444' }, 'NONCE_MISMATCH'],
    [{ grantId: 'grant-b' }, 'AUTHORIZATION_DENIED'],
    [{ expiresAt: 1_050 }, 'GRANT_EXPIRED'],
    [{ revokedAt: 1_040 }, 'GRANT_REVOKED'],
  ];
  for (const [grantOverride, code] of cases) {
    assert.deepEqual(validateFiscalTrustBindingsV1({
      command: command(), identity, grant: grant(grantOverride), nowEpochSeconds: 1_050,
    }), { valid: false, code });
  }
});

test('rejeita identidade expirada ou emitida no futuro', () => {
  for (const identityOverride of [{ expiresAt: 1_050 }, { issuedAt: 1_051 }]) {
    assert.deepEqual(validateFiscalTrustBindingsV1({
      command: command(), identity: { ...identity, ...identityOverride }, grant: grant(), nowEpochSeconds: 1_050,
    }), { valid: false, code: 'AUTHENTICATION_EXPIRED' });
  }
  assert.equal(verifiedServiceIdentityV1Schema.safeParse({ ...identity, expiresAt: identity.issuedAt }).success, false);
  assert.equal(trustedFiscalGrantV1Schema.safeParse(grant({ expiresAt: 1_000 })).success, false);
  assert.deepEqual(validateFiscalTrustBindingsV1({
    command: command(), identity, grant: grant({ issuedAt: 1_051 }), nowEpochSeconds: 1_050,
  }), { valid: false, code: 'AUTHORIZATION_DENIED' });
});

test('define compatibilidade por major V1 sem aceitar V2 ou formatos ambíguos', () => {
  assert.equal(isFiscalContractVersionCompatibleV1('1.0'), true);
  assert.equal(isFiscalContractVersionCompatibleV1('1.9'), true);
  assert.equal(isFiscalContractVersionCompatibleV1('2.0'), false);
  assert.equal(isFiscalContractVersionCompatibleV1('1'), false);
  assert.equal(isFiscalContractVersionCompatibleV1('01.0'), false);
});

test('valida respostas de erro padronizadas e seus limites', () => {
  const error = {
    contractVersion: FISCAL_CONTRACT_VERSION_V1,
    operationId: ids.operation,
    correlationId: ids.correlation,
    success: false as const,
    code: 'SERVICE_UNAVAILABLE' as const,
    message: 'Serviço fiscal indisponível.',
    retryable: true,
    retryAfterSeconds: 30,
  };
  assert.deepEqual(fiscalErrorResponseV1Schema.parse(error), error);
  assert.equal(fiscalErrorResponseV1Schema.safeParse({ ...error, code: 'INTERNAL_STACK_TRACE' }).success, false);
  assert.equal(fiscalErrorResponseV1Schema.safeParse({ ...error, retryAfterSeconds: 3_601 }).success, false);
});

test('status V1 não declara emissão real concluída', () => {
  assert.equal(fiscalProcessingStatusV1Schema.safeParse('BLOCKED_503').success, true);
  assert.equal(fiscalProcessingStatusV1Schema.safeParse('EMITTED').success, false);
  assert.equal(fiscalProcessingStatusV1Schema.safeParse('EMITIDA').success, false);
});

test('serializa e desserializa comando e respostas sem perda', () => {
  const originalCommand = command();
  assert.deepEqual(deserializeFiscalCommandV1(serializeFiscalCommandV1(originalCommand)), originalCommand);

  const response = {
    contractVersion: FISCAL_CONTRACT_VERSION_V1,
    operationId: ids.operation,
    correlationId: ids.correlation,
    success: true as const,
    companyId: 'company-a',
    requestId: 'request-a',
    status: 'BLOCKED_503' as const,
  };
  assert.deepEqual(deserializeFiscalResponseV1(serializeFiscalResponseV1(response)), response);
  assert.throws(() => deserializeFiscalCommandV1('{invalid-json'));
});

test('módulo do contrato permanece isolado de frameworks e infraestrutura', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile('contracts/fiscal/v1.ts', 'utf8'));
  for (const forbidden of ['next/', 'react', 'firebase', 'firestore', 'process.env', '@/']) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});
