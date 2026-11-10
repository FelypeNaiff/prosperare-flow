import type { FiscalPurpose } from './contracts';

export type InternalActorProfile = 'ADMINISTRADOR_FISCAL' | 'FUNCIONARIO_FISCAL' | 'CLIENTE';

export interface TrustedAuthorizationGrant {
  id: string;
  actorUid: string;
  actorProfile: InternalActorProfile;
  companyId: string;
  permissions: readonly FiscalPurpose[];
  issuedToServiceSubject: string;
  boundNonce: string;
  expiresAt: number;
  revokedAt?: number;
}

export interface AuthorizationGrantStore {
  findById(grantId: string): Promise<TrustedAuthorizationGrant | null>;
}

export class LocalSyntheticGrantStore implements AuthorizationGrantStore {
  private readonly grants = new Map<string, TrustedAuthorizationGrant>();

  issueFromTrustedComponent(grant: TrustedAuthorizationGrant): void {
    if (this.grants.has(grant.id)) throw new Error('Grant sintético duplicado.');
    this.grants.set(grant.id, Object.freeze({ ...grant, permissions: Object.freeze([...grant.permissions]) }));
  }

  revokeFromTrustedComponent(grantId: string, revokedAt: number): void {
    const current = this.grants.get(grantId);
    if (!current) throw new Error('Grant sintético inexistente.');
    this.grants.set(grantId, Object.freeze({ ...current, revokedAt }));
  }

  async findById(grantId: string): Promise<TrustedAuthorizationGrant | null> {
    return this.grants.get(grantId) || null;
  }
}
