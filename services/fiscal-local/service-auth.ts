import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

import { fiscalPurposeSchema, type FiscalPurpose } from './contracts';

const claimsSchema = z.object({
  issuer: z.string().min(1).max(200),
  subject: z.string().min(1).max(128),
  audience: z.string().min(1).max(200),
  expiresAt: z.number().int().positive(),
  issuedAt: z.number().int().nonnegative(),
  purpose: fiscalPurposeSchema,
  grantId: z.string().min(1).max(128),
  nonce: z.string().uuid(),
}).strict();

export type SyntheticServiceClaims = z.infer<typeof claimsSchema>;

export interface ServiceIdentityVerificationContext {
  expectedAudience: string;
  expectedPurpose: FiscalPurpose;
  nowEpochSeconds: number;
}

export interface VerifiedServiceIdentity extends SyntheticServiceClaims {}

export interface ServiceIdentityVerifier {
  verify(token: string, context: ServiceIdentityVerificationContext): Promise<VerifiedServiceIdentity>;
}

export class ServiceAuthenticationError extends Error {
  constructor(public readonly code: 'AUTHENTICATION_INVALID' | 'AUTHENTICATION_EXPIRED' | 'AUDIENCE_MISMATCH' | 'IDENTITY_NOT_ALLOWED') {
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

function verifySignatureAndParse(token: string, secret: Uint8Array): SyntheticServiceClaims {
  const parts = token.split('.');
  if (parts.length !== 2) throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
  const [payload, providedSignature] = parts;
  try {
    const expected = signature(payload, secret);
    const provided = Buffer.from(providedSignature, 'base64url');
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
    }
    return claimsSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
  } catch (error) {
    if (error instanceof ServiceAuthenticationError) throw error;
    throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
  }
}

export class SyntheticServiceIdentityVerifier implements ServiceIdentityVerifier {
  constructor(private readonly config: {
    secret: Uint8Array;
    expectedIssuer: string;
    allowedSubjects: ReadonlySet<string>;
  }) {}

  async verify(token: string, context: ServiceIdentityVerificationContext): Promise<VerifiedServiceIdentity> {
    const claims = verifySignatureAndParse(token, this.config.secret);
    if (claims.issuer !== this.config.expectedIssuer) throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
    if (claims.audience !== context.expectedAudience) throw new ServiceAuthenticationError('AUDIENCE_MISMATCH');
    if (claims.expiresAt <= context.nowEpochSeconds || claims.issuedAt > context.nowEpochSeconds + 30) {
      throw new ServiceAuthenticationError('AUTHENTICATION_EXPIRED');
    }
    if (claims.purpose !== context.expectedPurpose) throw new ServiceAuthenticationError('AUTHENTICATION_INVALID');
    if (!this.config.allowedSubjects.has(claims.subject)) throw new ServiceAuthenticationError('IDENTITY_NOT_ALLOWED');
    return claims;
  }
}
