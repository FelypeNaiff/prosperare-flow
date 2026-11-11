import { z } from 'zod';

export const FISCAL_CONTRACT_VERSION_V1 = '1.0' as const;

const boundedIdentifier = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const idempotencyIdentifier = z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const epochSeconds = z.number().int().nonnegative();

export const fiscalContractVersionV1Schema = z.literal(FISCAL_CONTRACT_VERSION_V1);

export const fiscalOperationV1Schema = z.enum([
  'VALIDATE_CREDENTIAL',
  'PREPARE_NFSE',
  'GET_NFSE_STATUS',
  'RECONCILE_NFSE',
]);
export type FiscalOperationV1 = z.infer<typeof fiscalOperationV1Schema>;

export const fiscalProcessingStatusV1Schema = z.enum([
  'RECEIVED',
  'VALIDATED',
  'SYNTHETIC_VALIDATED',
  'BLOCKED_503',
  'RECONCILIATION_REQUIRED',
  'REJECTED',
]);
export type FiscalProcessingStatusV1 = z.infer<typeof fiscalProcessingStatusV1Schema>;

export const fiscalErrorCodeV1Schema = z.enum([
  'INVALID_REQUEST',
  'UNSUPPORTED_CONTRACT_VERSION',
  'AUTHENTICATION_REQUIRED',
  'AUTHENTICATION_INVALID',
  'AUTHENTICATION_EXPIRED',
  'AUDIENCE_MISMATCH',
  'IDENTITY_NOT_ALLOWED',
  'AUTHORIZATION_DENIED',
  'GRANT_EXPIRED',
  'GRANT_REVOKED',
  'COMPANY_SCOPE_MISMATCH',
  'OPERATION_SCOPE_MISMATCH',
  'NONCE_MISMATCH',
  'REQUEST_REPLAYED',
  'IDEMPOTENCY_CONFLICT',
  'RESOURCE_NOT_FOUND',
  'SERVICE_UNAVAILABLE',
  'SERVICE_TIMEOUT',
  'PRODUCTION_BLOCKED',
]);
export type FiscalErrorCodeV1 = z.infer<typeof fiscalErrorCodeV1Schema>;

const selfDeclaredAuthorizationKey = /^(permissions?|roles?|profiles?|scopes?|serviceIdentity|serviceSubject|authenticatedIdentity)$/i;

function findSelfDeclaredAuthorization(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSelfDeclaredAuthorization(item);
      if (found) return found;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (selfDeclaredAuthorizationKey.test(key)) return key;
    const found = findSelfDeclaredAuthorization(nested);
    if (found) return found;
  }
  return null;
}

const fiscalPayloadV1Schema = z.record(z.string(), z.unknown()).superRefine((payload, context) => {
  const forbiddenKey = findSelfDeclaredAuthorization(payload);
  if (forbiddenKey) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Campo de autorização autodeclarado não permitido: ${forbiddenKey}.`,
    });
  }
});

export const fiscalCommandV1Schema = z.object({
  contractVersion: fiscalContractVersionV1Schema,
  operationId: z.string().uuid(),
  operation: fiscalOperationV1Schema,
  correlationId: z.string().uuid(),
  idempotencyKey: idempotencyIdentifier,
  companyId: boundedIdentifier,
  grantId: boundedIdentifier,
  nonceId: z.string().uuid(),
  payload: fiscalPayloadV1Schema,
}).strict();
export type FiscalCommandV1 = z.infer<typeof fiscalCommandV1Schema>;

// Este contexto é produzido por um adaptador OIDC confiável. Não pertence ao
// JSON enviado pelo chamador e não autentica ninguém por si só.
export const verifiedServiceIdentityV1Schema = z.object({
  issuer: z.string().url().max(256),
  audience: z.string().min(1).max(256),
  subject: boundedIdentifier,
  issuedAt: epochSeconds,
  expiresAt: epochSeconds,
}).strict().refine((identity) => identity.expiresAt > identity.issuedAt, {
  message: 'expiresAt must be greater than issuedAt',
  path: ['expiresAt'],
});
export type VerifiedServiceIdentityV1 = z.infer<typeof verifiedServiceIdentityV1Schema>;

// O grant é carregado de persistência confiável; nunca é aceito no body do
// comando. O contrato apenas valida sua forma e seus vínculos.
export const trustedFiscalGrantV1Schema = z.object({
  grantId: boundedIdentifier,
  actorId: boundedIdentifier,
  companyId: boundedIdentifier,
  operation: fiscalOperationV1Schema,
  issuedToServiceSubject: boundedIdentifier,
  nonceId: z.string().uuid(),
  issuedAt: epochSeconds,
  expiresAt: epochSeconds,
  revokedAt: epochSeconds.optional(),
}).strict().refine((grant) => grant.expiresAt > grant.issuedAt, {
  message: 'expiresAt must be greater than issuedAt',
  path: ['expiresAt'],
});
export type TrustedFiscalGrantV1 = z.infer<typeof trustedFiscalGrantV1Schema>;

const responseBaseV1Schema = z.object({
  contractVersion: fiscalContractVersionV1Schema,
  operationId: z.string().uuid(),
  correlationId: z.string().uuid(),
}).strict();

export const fiscalSuccessResponseV1Schema = responseBaseV1Schema.extend({
  success: z.literal(true),
  companyId: boundedIdentifier,
  requestId: boundedIdentifier,
  status: fiscalProcessingStatusV1Schema,
}).strict();
export type FiscalSuccessResponseV1 = z.infer<typeof fiscalSuccessResponseV1Schema>;

export const fiscalErrorResponseV1Schema = responseBaseV1Schema.extend({
  success: z.literal(false),
  code: fiscalErrorCodeV1Schema,
  message: z.string().trim().min(1).max(160),
  retryable: z.boolean(),
  retryAfterSeconds: z.number().int().positive().max(3_600).optional(),
}).strict();
export type FiscalErrorResponseV1 = z.infer<typeof fiscalErrorResponseV1Schema>;

export const fiscalResponseV1Schema = z.discriminatedUnion('success', [
  fiscalSuccessResponseV1Schema,
  fiscalErrorResponseV1Schema,
]);
export type FiscalResponseV1 = z.infer<typeof fiscalResponseV1Schema>;

export type FiscalTrustValidationV1 =
  | { valid: true }
  | { valid: false; code: Extract<FiscalErrorCodeV1,
    | 'AUTHENTICATION_EXPIRED'
    | 'AUTHORIZATION_DENIED'
    | 'GRANT_EXPIRED'
    | 'GRANT_REVOKED'
    | 'COMPANY_SCOPE_MISMATCH'
    | 'OPERATION_SCOPE_MISMATCH'
    | 'NONCE_MISMATCH'> };

export function validateFiscalTrustBindingsV1(input: {
  command: FiscalCommandV1;
  identity: VerifiedServiceIdentityV1;
  grant: TrustedFiscalGrantV1;
  nowEpochSeconds: number;
}): FiscalTrustValidationV1 {
  const { command, identity, grant, nowEpochSeconds } = input;
  if (identity.expiresAt <= nowEpochSeconds || identity.issuedAt > nowEpochSeconds) {
    return { valid: false, code: 'AUTHENTICATION_EXPIRED' };
  }
  if (grant.grantId !== command.grantId || grant.issuedToServiceSubject !== identity.subject) {
    return { valid: false, code: 'AUTHORIZATION_DENIED' };
  }
  if (grant.revokedAt !== undefined) return { valid: false, code: 'GRANT_REVOKED' };
  if (grant.expiresAt <= nowEpochSeconds) return { valid: false, code: 'GRANT_EXPIRED' };
  if (grant.issuedAt > nowEpochSeconds) return { valid: false, code: 'AUTHORIZATION_DENIED' };
  if (grant.companyId !== command.companyId) return { valid: false, code: 'COMPANY_SCOPE_MISMATCH' };
  if (grant.operation !== command.operation) return { valid: false, code: 'OPERATION_SCOPE_MISMATCH' };
  if (grant.nonceId !== command.nonceId) return { valid: false, code: 'NONCE_MISMATCH' };
  return { valid: true };
}

export function isFiscalContractVersionCompatibleV1(version: string): boolean {
  return /^1\.\d+$/.test(version);
}

export function serializeFiscalCommandV1(command: FiscalCommandV1): string {
  return JSON.stringify(fiscalCommandV1Schema.parse(command));
}

export function deserializeFiscalCommandV1(serialized: string): FiscalCommandV1 {
  return fiscalCommandV1Schema.parse(JSON.parse(serialized) as unknown);
}

export function serializeFiscalResponseV1(response: FiscalResponseV1): string {
  return JSON.stringify(fiscalResponseV1Schema.parse(response));
}

export function deserializeFiscalResponseV1(serialized: string): FiscalResponseV1 {
  return fiscalResponseV1Schema.parse(JSON.parse(serialized) as unknown);
}
