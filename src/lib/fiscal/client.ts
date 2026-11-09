'use client';

import type { User } from 'firebase/auth';
import type { AccessibleCompany } from './types';

export async function authenticatedFiscalFetch(
  user: User,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function fetchAccessibleCompanies(user: User): Promise<AccessibleCompany[]> {
  const response = await authenticatedFiscalFetch(user, '/api/fiscal/empresas');
  if (!response.ok) throw new Error('Não foi possível carregar as empresas autorizadas.');
  const payload = (await response.json()) as { companies: AccessibleCompany[] };
  return payload.companies;
}
