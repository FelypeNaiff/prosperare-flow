import { z } from 'zod';

import {
  fiscalCommandV1Schema,
  trustedFiscalGrantV1Schema,
  validateFiscalTrustBindingsV1,
  verifiedServiceIdentityV1Schema,
  type FiscalErrorCodeV1,
} from '../../contracts/fiscal/v1';
import { isolatedFiscalRequestSchema, type IsolatedFiscalRequest } from './contracts';

const validateCredentialPayloadV1Schema = z.object({
  credentialId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/),
}).strict();

export type LocalFiscalV1BoundaryResult =
  | { accepted: true; request: IsolatedFiscalRequest }
  | { accepted: false; code: FiscalErrorCodeV1 };

/**
 * Translation seam for the future standalone service.
 *
 * `networkCommand` is untrusted wire data. Identity and grant must be supplied
 * by external trusted adapters after OIDC verification and grant lookup; their
 * presence in client JSON never establishes trust.
 */
export function acceptLocalFiscalCommandV1(input: {
  networkCommand: unknown;
  verifiedIdentity: unknown;
  trustedGrant: unknown;
  nowEpochSeconds: number;
}): LocalFiscalV1BoundaryResult {
  const commandResult = fiscalCommandV1Schema.safeParse(input.networkCommand);
  if (!commandResult.success) return { accepted: false, code: 'INVALID_REQUEST' };

  const identityResult = verifiedServiceIdentityV1Schema.safeParse(input.verifiedIdentity);
  if (!identityResult.success) return { accepted: false, code: 'AUTHENTICATION_INVALID' };

  const grantResult = trustedFiscalGrantV1Schema.safeParse(input.trustedGrant);
  if (!grantResult.success) return { accepted: false, code: 'AUTHORIZATION_DENIED' };

  const trust = validateFiscalTrustBindingsV1({
    command: commandResult.data,
    identity: identityResult.data,
    grant: grantResult.data,
    nowEpochSeconds: input.nowEpochSeconds,
  });
  if (!trust.valid) return { accepted: false, code: trust.code };

  if (commandResult.data.operation !== 'VALIDATE_CREDENTIAL') {
    return { accepted: false, code: 'PRODUCTION_BLOCKED' };
  }
  const payloadResult = validateCredentialPayloadV1Schema.safeParse(commandResult.data.payload);
  if (!payloadResult.success) return { accepted: false, code: 'INVALID_REQUEST' };

  const request = isolatedFiscalRequestSchema.parse({
    companyId: commandResult.data.companyId,
    credentialId: payloadResult.data.credentialId,
    purpose: 'VALIDAR_CREDENCIAL_SINTETICA',
    correlationId: commandResult.data.correlationId,
  });
  return { accepted: true, request };
}
