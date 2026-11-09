export const CERTIFICATE_STATUSES = ['VALIDO', 'VENCIDO', 'REVOGADO', 'SUBSTITUIDO'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface FiscalCertificateMetadata {
  id: string;
  clientId: string;
  holderCnpj: string;
  serialNumber: string;
  issuer: string;
  validFrom: string;
  expiresAt: string;
  status: CertificateStatus;
  secureStorageRef: string;
  createdAt: string;
  replacedAt?: string;
  revokedAt?: string;
  replacedById?: string;
}

export interface PublicCertificateMetadata {
  id: string;
  clientId: string;
  holderCnpj: string;
  serialNumber: string;
  issuer: string;
  validFrom: string;
  expiresAt: string;
  status: CertificateStatus;
  createdAt: string;
  replacedAt?: string;
  revokedAt?: string;
  replacedById?: string;
}

export interface SyntheticCertificateInspection {
  holderCnpj: string;
  serialNumber: string;
  issuer: string;
  validFrom: string;
  expiresAt: string;
  revoked: boolean;
}

export class CredentialValidationError extends Error {}

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateSyntheticCertificate(
  inspection: SyntheticCertificateInspection,
  expectedCnpj: string,
  now = new Date(),
): CertificateStatus {
  if (digits(inspection.holderCnpj) !== digits(expectedCnpj)) {
    throw new CredentialValidationError('O CNPJ do certificado não pertence à empresa selecionada.');
  }
  if (inspection.revoked) return 'REVOGADO';
  if (Number.isNaN(Date.parse(inspection.expiresAt)) || Number.isNaN(Date.parse(inspection.validFrom))) {
    throw new CredentialValidationError('Período de validade inválido.');
  }
  return new Date(inspection.expiresAt).getTime() <= now.getTime() ? 'VENCIDO' : 'VALIDO';
}

export function toPublicCertificateMetadata(metadata: FiscalCertificateMetadata): PublicCertificateMetadata {
  return {
    id: metadata.id,
    clientId: metadata.clientId,
    holderCnpj: metadata.holderCnpj,
    serialNumber: metadata.serialNumber,
    issuer: metadata.issuer,
    validFrom: metadata.validFrom,
    expiresAt: metadata.expiresAt,
    status: metadata.status,
    createdAt: metadata.createdAt,
    replacedAt: metadata.replacedAt,
    revokedAt: metadata.revokedAt,
    replacedById: metadata.replacedById,
  };
}

const SENSITIVE_KEYS = /pfx|password|senha|private.?key|secret|secureStorageRef/i;

export function sanitizeCredentialAuditMetadata(
  input: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key, value]) => !SENSITIVE_KEYS.test(key) && (['string', 'number', 'boolean'].includes(typeof value) || value === null))
      .map(([key, value]) => [key, value as string | number | boolean | null]),
  );
}
