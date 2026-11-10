import { createHash } from 'node:crypto';

import type { FiscalAuditEvent, FiscalAuditEventInput, FiscalAuditSink } from './audit-events';
import {
  MAX_REQUEST_BYTES,
  containsForbiddenExternalMaterial,
  isolatedFiscalRequestSchema,
  type FiscalErrorCode,
  type IsolatedFiscalRequest,
  type IsolatedFiscalResponse,
} from './contracts';
import type { AuthorizationGrantStore } from './grant-store';
import type { NonceStore } from './nonce-store';
import { ServiceAuthenticationError, type ServiceIdentityVerifier } from './service-auth';

export interface IsolatedFiscalDependencies {
  environment: string | undefined;
  audience: string;
  identityVerifier: ServiceIdentityVerifier;
  nonceStore: NonceStore;
  grantStore: AuthorizationGrantStore;
  nowEpochSeconds(): number;
  credentialExists(companyId: string, credentialId: string): Promise<boolean>;
  audit: FiscalAuditSink;
}

export interface InternalHttpRequest {
  headers: Readonly<Record<string, string | undefined>>;
  rawBody: string;
}

export interface InternalHttpResponse {
  status: number;
  body: IsolatedFiscalResponse;
}

const safeMessages: Record<FiscalErrorCode, string> = {
  INVALID_REQUEST: 'Solicitação interna inválida.',
  AUTHENTICATION_REQUIRED: 'Autenticação interna obrigatória.',
  AUTHENTICATION_INVALID: 'Autenticação interna inválida.',
  AUTHENTICATION_EXPIRED: 'Autenticação interna expirada.',
  AUDIENCE_MISMATCH: 'Destinatário da autenticação inválido.',
  IDENTITY_NOT_ALLOWED: 'Identidade de serviço não autorizada.',
  AUTHORIZATION_DENIED: 'Operação interna não autorizada.',
  GRANT_EXPIRED: 'Autorização interna expirada.',
  GRANT_REVOKED: 'Autorização interna revogada.',
  COMPANY_SCOPE_MISMATCH: 'Escopo empresarial inválido.',
  CREDENTIAL_NOT_FOUND: 'Credencial sintética não encontrada.',
  REQUEST_REPLAYED: 'Solicitação interna já utilizada.',
  SERVICE_UNAVAILABLE: 'Serviço fiscal temporariamente indisponível.',
  SERVICE_TIMEOUT: 'Tempo limite do serviço fiscal excedido.',
  PRODUCTION_BLOCKED: 'Protótipo fiscal local bloqueado em produção.',
};

function failure(code: FiscalErrorCode, status: number, correlationId?: string): InternalHttpResponse {
  return { status, body: { success: false, code, message: safeMessages[code], correlationId } };
}

function fingerprintNonce(nonce: string): string {
  return createHash('sha256').update(nonce).digest('hex').slice(0, 16);
}

export function createIsolatedFiscalService(deps: IsolatedFiscalDependencies) {
  if (deps.environment !== 'development' && deps.environment !== 'test') {
    throw new Error(safeMessages.PRODUCTION_BLOCKED);
  }

  return async function handle(request: InternalHttpRequest): Promise<InternalHttpResponse> {
    let input: IsolatedFiscalRequest | undefined;
    const now = deps.nowEpochSeconds();
    const audit = async (event: FiscalAuditEventInput) => deps.audit.record({ ...event, at: now } as FiscalAuditEvent);
    const deny = async (code: FiscalErrorCode, status: number, event: FiscalAuditEventInput) => {
      await audit(event);
      return failure(code, status, input?.correlationId);
    };
    const unavailable = async (component: 'NONCE_STORE' | 'GRANT_STORE' | 'CREDENTIAL_STORE' | 'AUDIT_SINK') => {
      await Promise.resolve(audit({
        type: 'INFRASTRUCTURE_FAILURE', component,
        correlationId: input?.correlationId, companyId: input?.companyId,
      })).catch(() => undefined);
      return failure('SERVICE_UNAVAILABLE', 503, input?.correlationId);
    };

    try {
      if (Buffer.byteLength(request.rawBody, 'utf8') > MAX_REQUEST_BYTES) {
        return deny('INVALID_REQUEST', 400, { type: 'AUTHENTICATION_DENIED', reason: 'INVALID_REQUEST' });
      }
      const parsed = JSON.parse(request.rawBody) as unknown;
      if (containsForbiddenExternalMaterial(parsed)) {
        return deny('INVALID_REQUEST', 400, { type: 'AUTHENTICATION_DENIED', reason: 'INVALID_REQUEST' });
      }
      const result = isolatedFiscalRequestSchema.safeParse(parsed);
      if (!result.success) return deny('INVALID_REQUEST', 400, { type: 'AUTHENTICATION_DENIED', reason: 'INVALID_REQUEST' });
      input = result.data;

      if (request.headers.origin || request.headers['sec-fetch-site']) {
        return deny('AUTHENTICATION_INVALID', 401, {
          type: 'AUTHENTICATION_DENIED', reason: 'AUTHENTICATION_INVALID', correlationId: input.correlationId,
        });
      }
      const token = request.headers['x-prosperare-internal-auth'];
      if (!token) return deny('AUTHENTICATION_REQUIRED', 401, {
        type: 'AUTHENTICATION_DENIED', reason: 'AUTHENTICATION_REQUIRED', correlationId: input.correlationId,
      });

      let identity;
      try {
        identity = await deps.identityVerifier.verify(token, {
          expectedAudience: deps.audience,
          expectedPurpose: input.purpose,
          nowEpochSeconds: now,
        });
      } catch (error) {
        const code = error instanceof ServiceAuthenticationError ? error.code : 'AUTHENTICATION_INVALID';
        return deny(code, code === 'IDENTITY_NOT_ALLOWED' ? 403 : 401, {
          type: 'AUTHENTICATION_DENIED', reason: code, correlationId: input.correlationId,
        });
      }
      await audit({
        type: 'AUTHENTICATION_PERMITTED', serviceSubject: identity.subject,
        correlationId: input.correlationId, companyId: input.companyId,
      });

      let grant;
      try {
        grant = await deps.grantStore.findById(identity.grantId);
      } catch {
        return unavailable('GRANT_STORE');
      }
      if (!grant) return deny('AUTHORIZATION_DENIED', 403, {
        type: 'GRANT_DENIED', grantId: identity.grantId, reason: 'AUTHORIZATION_DENIED',
        correlationId: input.correlationId, companyId: input.companyId,
      });
      if (grant.revokedAt !== undefined) return deny('GRANT_REVOKED', 403, {
        type: 'GRANT_REVOKED', grantId: grant.id, correlationId: input.correlationId, companyId: input.companyId,
      });
      if (grant.expiresAt <= now) return deny('GRANT_EXPIRED', 403, {
        type: 'GRANT_EXPIRED', grantId: grant.id, correlationId: input.correlationId, companyId: input.companyId,
      });
      if (grant.actorProfile === 'CLIENTE' || !grant.permissions.includes(input.purpose)
        || grant.issuedToServiceSubject !== identity.subject || grant.boundNonce !== identity.nonce) {
        return deny('AUTHORIZATION_DENIED', 403, {
          type: 'GRANT_DENIED', grantId: grant.id, reason: 'AUTHORIZATION_DENIED',
          correlationId: input.correlationId, companyId: input.companyId,
        });
      }
      if (grant.companyId !== input.companyId) return deny('COMPANY_SCOPE_MISMATCH', 403, {
        type: 'COMPANY_MISMATCH', grantId: grant.id,
        correlationId: input.correlationId, companyId: input.companyId,
      });
      await audit({
        type: 'GRANT_VALID', grantId: grant.id, actorUid: grant.actorUid,
        correlationId: input.correlationId, companyId: input.companyId,
      });

      let nonceResult;
      try {
        nonceResult = await deps.nonceStore.registerOnce(identity.nonce, identity.expiresAt, now);
      } catch {
        return unavailable('NONCE_STORE');
      }
      if (nonceResult === 'REPLAYED') return deny('REQUEST_REPLAYED', 409, {
        type: 'REPLAY_DETECTED', nonceFingerprint: fingerprintNonce(identity.nonce),
        correlationId: input.correlationId, companyId: input.companyId,
      });

      try {
        if (!await deps.credentialExists(input.companyId, input.credentialId)) {
          return deny('CREDENTIAL_NOT_FOUND', 404, {
            type: 'GRANT_DENIED', grantId: grant.id, reason: 'CREDENTIAL_NOT_FOUND',
            correlationId: input.correlationId, companyId: input.companyId,
          });
        }
      } catch {
        return unavailable('CREDENTIAL_STORE');
      }
      await audit({
        type: 'SYNTHETIC_OPERATION_AUTHORIZED', actorUid: grant.actorUid,
        credentialId: input.credentialId, purpose: input.purpose,
        correlationId: input.correlationId, companyId: input.companyId,
      });
      return {
        status: 200,
        body: {
          success: true, state: 'SYNTHETIC_VALIDATED', companyId: input.companyId,
          credentialId: input.credentialId, purpose: input.purpose, correlationId: input.correlationId,
        },
      };
    } catch {
      return unavailable('AUDIT_SINK');
    }
  };
}
