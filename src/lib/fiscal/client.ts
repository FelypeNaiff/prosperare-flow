'use client';

import type { User } from 'firebase/auth';
import { authenticatedFetch } from '@/lib/http/authenticated-fetch';
import type { AccessibleCompany } from './types';
import type { PublicCertificateMetadata } from './credentials';

export async function fetchCertificateMetadata(
  user: User,
  clientId: string,
): Promise<PublicCertificateMetadata[]> {
  const response = await authenticatedFetch(
    user,
    `/api/fiscal/credenciais?clientId=${encodeURIComponent(clientId)}`,
  );
  if (!response.ok) throw new Error('Não foi possível consultar os metadados do certificado.');
  const payload = (await response.json()) as { certificates: PublicCertificateMetadata[] };
  return payload.certificates;
}

export async function fetchAccessibleCompanies(user: User): Promise<AccessibleCompany[]> {
  const response = await authenticatedFetch(user, '/api/fiscal/empresas');
  if (!response.ok) throw new Error('Não foi possível carregar as empresas autorizadas.');
  const payload = (await response.json()) as { companies: AccessibleCompany[] };
  return payload.companies;
}
