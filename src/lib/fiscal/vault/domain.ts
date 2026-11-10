export type VaultOperation = 'ARMAZENAR' | 'RECUPERAR' | 'REVOGAR' | 'DESTRUIR';

export interface VaultAccessContext {
  actorUid: string;
  clientId: string;
  actorType: 'FUNCIONARIO' | 'CLIENTE';
  active: boolean;
  administrarCredenciais: boolean;
  transverseFiscalAdmin?: boolean;
}

export interface StoreCredentialInput {
  credentialId: string;
  clientId: string;
  syntheticMaterial: Uint8Array;
  syntheticPassphrase: Uint8Array;
}

export interface VaultCredentialReference {
  credentialId: string;
  clientId: string;
  version: number;
  opaqueStorageRef: string;
}

export interface VaultSecretLease {
  readonly syntheticMaterial: Buffer;
  readonly syntheticPassphrase: Buffer;
  dispose(): void;
}

export interface VaultAuditEvent {
  actorUid: string;
  clientId: string;
  credentialId: string;
  operation: VaultOperation;
  result: 'PERMITIDO' | 'NEGADO' | 'ERRO';
  version?: number;
}

export interface VaultAuditSink {
  record(event: VaultAuditEvent): void | Promise<void>;
}

export interface FiscalCredentialVault {
  store(context: VaultAccessContext, input: StoreCredentialInput): Promise<VaultCredentialReference>;
  retrieve(context: VaultAccessContext, credentialId: string, version?: number): Promise<VaultSecretLease>;
  revoke(context: VaultAccessContext, credentialId: string): Promise<void>;
  destroy(context: VaultAccessContext, credentialId: string): Promise<void>;
}

export class VaultSecurityError extends Error {
  constructor(message: string, public readonly code: 'UNAUTHORIZED' | 'CROSS_COMPANY' | 'NOT_FOUND' | 'REVOKED' | 'REPLACED' | 'PRODUCTION_BLOCKED') {
    super(message);
    this.name = 'VaultSecurityError';
  }
}

export function assertVaultAccess(context: VaultAccessContext, clientId: string): void {
  if (!context.active || context.actorType === 'CLIENTE' || !context.administrarCredenciais) {
    throw new VaultSecurityError('Operação de cofre não autorizada.', 'UNAUTHORIZED');
  }
  if (!context.transverseFiscalAdmin && context.clientId !== clientId) {
    throw new VaultSecurityError('Acesso cruzado entre empresas não permitido.', 'CROSS_COMPANY');
  }
}
