import { z } from 'zod';

const boundedId = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export const fiscalPurposeSchema = z.enum(['VALIDAR_CREDENCIAL_SINTETICA']);
export type FiscalPurpose = z.infer<typeof fiscalPurposeSchema>;

export const isolatedFiscalRequestSchema = z.object({
  companyId: boundedId,
  credentialId: boundedId,
  purpose: fiscalPurposeSchema,
  correlationId: z.string().uuid(),
}).strict();
export type IsolatedFiscalRequest = z.infer<typeof isolatedFiscalRequestSchema>;

export const sanitizedFiscalResultSchema = z.object({
  success: z.literal(true),
  state: z.literal('SYNTHETIC_VALIDATED'),
  companyId: boundedId,
  credentialId: boundedId,
  purpose: fiscalPurposeSchema,
  correlationId: z.string().uuid(),
}).strict();
export type SanitizedFiscalResult = z.infer<typeof sanitizedFiscalResultSchema>;

export const fiscalErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'AUTHENTICATION_REQUIRED',
  'AUTHENTICATION_INVALID',
  'AUTHENTICATION_EXPIRED',
  'AUDIENCE_MISMATCH',
  'IDENTITY_NOT_ALLOWED',
  'AUTHORIZATION_DENIED',
  'GRANT_EXPIRED',
  'GRANT_REVOKED',
  'COMPANY_SCOPE_MISMATCH',
  'CREDENTIAL_NOT_FOUND',
  'REQUEST_REPLAYED',
  'SERVICE_UNAVAILABLE',
  'SERVICE_TIMEOUT',
  'PRODUCTION_BLOCKED',
]);
export type FiscalErrorCode = z.infer<typeof fiscalErrorCodeSchema>;

export const sanitizedFiscalErrorSchema = z.object({
  success: z.literal(false),
  code: fiscalErrorCodeSchema,
  message: z.string().min(1).max(160),
  correlationId: z.string().uuid().optional(),
}).strict();
export type SanitizedFiscalError = z.infer<typeof sanitizedFiscalErrorSchema>;

export type IsolatedFiscalResponse = SanitizedFiscalResult | SanitizedFiscalError;

export const MAX_REQUEST_BYTES = 2_048;

export function containsForbiddenExternalMaterial(value: unknown): boolean {
  return /pfx|p12|pass(word|phrase)?|senha|private.?key|chave.?privada|certificate.?material/i
    .test(JSON.stringify(value));
}
