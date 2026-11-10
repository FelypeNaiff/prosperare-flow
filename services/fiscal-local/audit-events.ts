import type { FiscalErrorCode, FiscalPurpose } from './contracts';

interface AuditBase {
  at: number;
  correlationId?: string;
  companyId?: string;
}

export type FiscalAuditEvent = AuditBase & (
  | { type: 'AUTHENTICATION_PERMITTED'; serviceSubject: string }
  | { type: 'AUTHENTICATION_DENIED'; reason: FiscalErrorCode }
  | { type: 'GRANT_VALID'; grantId: string; actorUid: string }
  | { type: 'GRANT_EXPIRED'; grantId: string }
  | { type: 'GRANT_REVOKED'; grantId: string }
  | { type: 'GRANT_DENIED'; grantId?: string; reason: FiscalErrorCode }
  | { type: 'COMPANY_MISMATCH'; grantId: string }
  | { type: 'REPLAY_DETECTED'; nonceFingerprint: string }
  | { type: 'INFRASTRUCTURE_FAILURE'; component: 'NONCE_STORE' | 'GRANT_STORE' | 'CREDENTIAL_STORE' | 'AUDIT_SINK' }
  | { type: 'SYNTHETIC_OPERATION_AUTHORIZED'; actorUid: string; credentialId: string; purpose: FiscalPurpose }
);

export type FiscalAuditEventInput = FiscalAuditEvent extends infer Event
  ? Event extends { at: number } ? Omit<Event, 'at'> : never
  : never;

export interface FiscalAuditSink {
  record(event: FiscalAuditEvent): void | Promise<void>;
}
