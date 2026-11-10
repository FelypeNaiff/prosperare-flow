import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';

import {
  assertVaultAccess,
  VaultSecurityError,
  type FiscalCredentialVault,
  type StoreCredentialInput,
  type VaultAccessContext,
  type VaultAuditEvent,
  type VaultAuditSink,
  type VaultCredentialReference,
  type VaultOperation,
  type VaultSecretLease,
} from './domain';

interface EncryptedPart { ciphertext: Buffer; iv: Buffer; authTag: Buffer }
interface StoredVersion {
  credentialId: string;
  clientId: string;
  version: number;
  opaqueStorageRef: string;
  material: EncryptedPart;
  passphrase: EncryptedPart;
  status: 'ATIVA' | 'SUBSTITUIDA' | 'REVOGADA';
}

export class SimulatedFiscalCredentialVault implements FiscalCredentialVault {
  private readonly masterKey = randomBytes(32);
  private readonly records = new Map<string, StoredVersion[]>();

  constructor(
    private readonly audit: VaultAuditSink,
  ) {
    if (process.env.NODE_ENV === 'production') {
      this.masterKey.fill(0);
      throw new VaultSecurityError('Cofre simulado é proibido em produção.', 'PRODUCTION_BLOCKED');
    }
  }

  async store(context: VaultAccessContext, input: StoreCredentialInput): Promise<VaultCredentialReference> {
    this.authorize(context, input.clientId, input.credentialId, 'ARMAZENAR');
    const material = Buffer.from(input.syntheticMaterial);
    const passphrase = Buffer.from(input.syntheticPassphrase);
    try {
      const key = this.key(input.clientId, input.credentialId);
      const versions = this.records.get(key) || [];
      const current = versions.at(-1);
      if (current?.status === 'ATIVA') current.status = 'SUBSTITUIDA';
      const version = versions.length + 1;
      const record: StoredVersion = {
        credentialId: input.credentialId,
        clientId: input.clientId,
        version,
        opaqueStorageRef: `simulated://${randomUUID()}`,
        material: this.encrypt(material, this.aad(input.clientId, input.credentialId, version, 'material')),
        passphrase: this.encrypt(passphrase, this.aad(input.clientId, input.credentialId, version, 'passphrase')),
        status: 'ATIVA',
      };
      versions.push(record);
      this.records.set(key, versions);
      await this.record({ ...context, clientId: input.clientId }, input.credentialId, 'ARMAZENAR', 'PERMITIDO', record.version);
      return this.reference(record);
    } finally {
      material.fill(0);
      passphrase.fill(0);
    }
  }

  async retrieve(context: VaultAccessContext, credentialId: string, version?: number): Promise<VaultSecretLease> {
    const record = this.find(context, credentialId, version, 'RECUPERAR');
    if (record.status === 'REVOGADA') throw new VaultSecurityError('Credencial revogada.', 'REVOKED');
    if (record.status === 'SUBSTITUIDA') throw new VaultSecurityError('Versão substituída não pode ser recuperada.', 'REPLACED');
    let material: Buffer | undefined;
    let passphrase: Buffer | undefined;
    try {
      material = this.decrypt(record.material, this.aad(record.clientId, record.credentialId, record.version, 'material'));
      passphrase = this.decrypt(record.passphrase, this.aad(record.clientId, record.credentialId, record.version, 'passphrase'));
      await this.record(context, credentialId, 'RECUPERAR', 'PERMITIDO', record.version);
    } catch (error) {
      material?.fill(0);
      passphrase?.fill(0);
      throw error;
    }
    let disposed = false;
    return {
      syntheticMaterial: material,
      syntheticPassphrase: passphrase,
      dispose() {
        if (disposed) return;
        material.fill(0);
        passphrase.fill(0);
        disposed = true;
      },
    };
  }

  async revoke(context: VaultAccessContext, credentialId: string): Promise<void> {
    const record = this.find(context, credentialId, undefined, 'REVOGAR');
    record.status = 'REVOGADA';
    await this.record(context, credentialId, 'REVOGAR', 'PERMITIDO', record.version);
  }

  async destroy(context: VaultAccessContext, credentialId: string): Promise<void> {
    this.authorize(context, context.clientId, credentialId, 'DESTRUIR');
    const key = this.key(context.clientId, credentialId);
    const versions = this.records.get(key);
    if (!versions?.length) throw new VaultSecurityError('Credencial inexistente.', 'NOT_FOUND');
    for (const version of versions) {
      for (const part of [version.material, version.passphrase]) {
        part.ciphertext.fill(0); part.iv.fill(0); part.authTag.fill(0);
      }
    }
    this.records.delete(key);
    await this.record(context, credentialId, 'DESTRUIR', 'PERMITIDO');
  }

  private find(context: VaultAccessContext, credentialId: string, version: number | undefined, operation: VaultOperation): StoredVersion {
    this.authorize(context, context.clientId, credentialId, operation);
    const versions = this.records.get(this.key(context.clientId, credentialId));
    const record = version === undefined ? versions?.at(-1) : versions?.find((item) => item.version === version);
    if (!record) throw new VaultSecurityError('Credencial inexistente.', 'NOT_FOUND');
    return record;
  }

  private authorize(context: VaultAccessContext, clientId: string, credentialId: string, operation: VaultOperation): void {
    try {
      assertVaultAccess(context, clientId);
    } catch (error) {
      void this.record({ ...context, clientId }, credentialId, operation, 'NEGADO').catch(() => undefined);
      throw error;
    }
  }

  private encrypt(plaintext: Buffer, aad: Buffer): EncryptedPart {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { ciphertext, iv, authTag: cipher.getAuthTag() };
  }

  private decrypt(part: EncryptedPart, aad: Buffer): Buffer {
    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, part.iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(part.authTag);
    return Buffer.concat([decipher.update(part.ciphertext), decipher.final()]);
  }

  private aad(clientId: string, credentialId: string, version: number, part: 'material' | 'passphrase'): Buffer {
    return Buffer.from(JSON.stringify(['prosperare-vault-v1', clientId, credentialId, version, part]), 'utf8');
  }

  private key(clientId: string, credentialId: string): string { return JSON.stringify([clientId, credentialId]); }
  private reference(record: StoredVersion): VaultCredentialReference {
    return { credentialId: record.credentialId, clientId: record.clientId, version: record.version, opaqueStorageRef: record.opaqueStorageRef };
  }
  private async record(context: VaultAccessContext, credentialId: string, operation: VaultOperation, result: VaultAuditEvent['result'], version?: number): Promise<void> {
    await this.audit.record({ actorUid: context.actorUid, clientId: context.clientId, credentialId, operation, result, version });
  }
}
