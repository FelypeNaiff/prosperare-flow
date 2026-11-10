import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

import { fiscalPurposeSchema, type FiscalPurpose } from './contracts';

const claimsSchema = z.object({
  issuer: z.literal('prosperare-local-synthetic-authority'),
  subject: z.string().min(1).max(128),
  audience: z.string().min(1).max(128),
  expiresAt: z.number().int().positive(),
  issuedAt: z.number().int().nonnegative(),
  purpose: fiscalPurposeSchema,
  grantId: z.string().min(1).max(128),
  nonce: z.string().uuid(),
}).strict();

export type SyntheticServiceClaims = z.infer<typeof claimsSchema>;

export class ServiceAuthenticationError extends Error {
  constructor(public readonly code: 'AUTHENTICATION_INVALID' | 'AUTHENTICATION_EXPIRED' | 'AUDIENCE_MISMATCH') {
    super(code);
    this.name = 'ServiceAuthenticationError';
  }
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function signature(payload: string, secret: Uint8Array): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

export function issueSyntheticServiceToken(input: {
  subject: string;
  audience: string;
  purpose: FiscalPurpose;
  grantId: string;
  nonce: string;
  expiresAt: number;
  issuedAt: number;
}, secret: Uint8Array): string {
  const claims = claimsSchema.parse({ issuer: 'prosperare-local-synthetic-authority', ...input });
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${signature(payload, secret).toString('base64url')}`;
}

export function verifySyntheticServiceToken(
  token: string,
  secret: Uint8Array,
  expectedAudience: string,
  nowEpochSeconds: number,
): SyntheticServiceClaims {
  const parts = token.split('.');
  if (parts.length !== 2) throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
  const [payload, providedSignature] = parts;
  try {
    const expected = signature(payload, secret);
    const provided = Buffer.from(providedSignature, 'base64url');
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
    }
    const claims = claimsSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    if (claims.audience !== expectedAudience) throw new ServiceAuthenticationError('AUDIENCE_MISMATCH');
    if (claims.expiresAt <= nowEpochSeconds || claims.issuedAt > nowEpochSeconds + 30) {
      throw new ServiceAuthenticationError('AUTHENTICATION_EXPIRED');
    }
    return claims;
  } catch (error) {
    if (error instanceof ServiceAuthenticationError) throw error;
    throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
  }
}
