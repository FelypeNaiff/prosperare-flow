import {
  MAX_REQUEST_BYTES,
  containsForbiddenExternalMaterial,
  isolatedFiscalRequestSchema,
  type FiscalErrorCode,
  type IsolatedFiscalRequest,
  type IsolatedFiscalResponse,
} from './contracts';
import { ServiceAuthenticationError, verifySyntheticServiceToken } from './service-auth';

export interface TrustedAuthorizationGrant {
  id: string;
  actorUid: string;
  actorType: 'FUNCIONARIO' | 'CLIENTE';
  active: boolean;
  companyId: string;
  allowedPurposes: readonly IsolatedFiscalRequest['purpose'][];
}

export interface FiscalAuditEntry {
  correlationId?: string;
  companyId?: string;
  credentialId?: string;
  operation?: IsolatedFiscalRequest['purpose'];
  result: 'PERMITIDO' | 'NEGADO' | 'ERRO';
  reason?: FiscalErrorCode;
}

export interface IsolatedFiscalDependencies {
  environment: string | undefined;
  audience: string;
  allowedServiceIdentities: ReadonlySet<string>;
  syntheticSigningSecret: Uint8Array;
  nowEpochSeconds(): number;
  findGrant(grantId: string): Promise<TrustedAuthorizationGrant | null>;
  credentialExists(companyId: string, credentialId: string): Promise<boolean>;
  recordAudit(entry: FiscalAuditEntry): void | Promise<void>;
  recordLog(entry: Record<string, unknown>): void;
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

export function createIsolatedFiscalService(deps: IsolatedFiscalDependencies) {
  if (deps.environment !== 'development' && deps.environment !== 'test') {
    throw new Error(safeMessages.PRODUCTION_BLOCKED);
  }
  const consumedNonces = new Set<string>();

  return async function handle(request: InternalHttpRequest): Promise<InternalHttpResponse> {
    let input: IsolatedFiscalRequest | undefined;
    let auditRecorded = false;
    const deny = async (code: FiscalErrorCode, status: number) => {
      if (!auditRecorded) {
        auditRecorded = true;
        await deps.recordAudit({
          correlationId: input?.correlationId,
          companyId: input?.companyId,
          credentialId: input?.credentialId,
          operation: input?.purpose,
          result: 'NEGADO',
          reason: code,
        });
      }
      deps.recordLog({ level: 'warn', code, correlationId: input?.correlationId });
      return failure(code, status, input?.correlationId);
    };

    try {
      if (Buffer.byteLength(request.rawBody, 'utf8') > MAX_REQUEST_BYTES) return deny('INVALID_REQUEST', 400);
      const parsed = JSON.parse(request.rawBody) as unknown;
      if (containsForbiddenExternalMaterial(parsed)) return deny('INVALID_REQUEST', 400);
      const result = isolatedFiscalRequestSchema.safeParse(parsed);
      if (!result.success) return deny('INVALID_REQUEST', 400);
      input = result.data;

      // A presença de sinais de navegador invalida o canal. Em produção, IAM do
      // Cloud Run será a barreira primária e este serviço não será público.
      if (request.headers.origin || request.headers['sec-fetch-site']) return deny('AUTHENTICATION_INVALID', 401);
      const token = request.headers['x-prosperare-internal-auth'];
      if (!token) return deny('AUTHENTICATION_REQUIRED', 401);

      let claims;
      try {
        claims = verifySyntheticServiceToken(
          token,
          deps.syntheticSigningSecret,
          deps.audience,
          deps.nowEpochSeconds(),
        );
      } catch (error) {
        if (error instanceof ServiceAuthenticationError) return deny(error.code, 401);
        return deny('AUTHENTICATION_INVALID', 401);
      }
      if (!deps.allowedServiceIdentities.has(claims.subject)) return deny('IDENTITY_NOT_ALLOWED', 403);
      if (claims.purpose !== input.purpose) return deny('AUTHORIZATION_DENIED', 403);
      if (consumedNonces.has(claims.nonce)) return deny('REQUEST_REPLAYED', 409);

      const grant = await deps.findGrant(claims.grantId);
      if (!grant || !grant.active || grant.actorType === 'CLIENTE' || !grant.allowedPurposes.includes(input.purpose)) {
        return deny('AUTHORIZATION_DENIED', 403);
      }
      if (grant.companyId !== input.companyId) return deny('COMPANY_SCOPE_MISMATCH', 403);
      consumedNonces.add(claims.nonce);

      if (!await deps.credentialExists(input.companyId, input.credentialId)) {
        return deny('CREDENTIAL_NOT_FOUND', 404);
      }
      auditRecorded = true;
      await deps.recordAudit({
        correlationId: input.correlationId,
        companyId: input.companyId,
        credentialId: input.credentialId,
        operation: input.purpose,
        result: 'PERMITIDO',
      });
      deps.recordLog({ level: 'info', event: 'synthetic_fiscal_operation', correlationId: input.correlationId });
      return {
        status: 200,
        body: {
          success: true,
          state: 'SYNTHETIC_VALIDATED',
          companyId: input.companyId,
          credentialId: input.credentialId,
          purpose: input.purpose,
          correlationId: input.correlationId,
        },
      };
    } catch {
      await Promise.resolve(deps.recordAudit({
        correlationId: input?.correlationId,
        companyId: input?.companyId,
        credentialId: input?.credentialId,
        operation: input?.purpose,
        result: 'ERRO',
        reason: 'SERVICE_UNAVAILABLE',
      })).catch(() => undefined);
      deps.recordLog({ level: 'error', code: 'SERVICE_UNAVAILABLE', correlationId: input?.correlationId });
      return failure('SERVICE_UNAVAILABLE', 503, input?.correlationId);
    }
  };
}
