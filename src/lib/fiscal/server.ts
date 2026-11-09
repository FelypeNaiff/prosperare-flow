import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import {
  FiscalAuthorizationError,
  authorizeFiscalOperation,
  authorizeInternalNfseOperation,
  fullFiscalPermissions,
  isVerifiedAdministrator,
} from './authorization';
import type {
  AccessibleCompany,
  FiscalOperation,
  FiscalUser,
  UserCompanyAccess,
} from './types';

export async function requireFirebaseToken(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new FiscalAuthorizationError('Token Firebase ausente.', 401);
  }
  try {
    return await adminAuth.verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new FiscalAuthorizationError('Token Firebase inválido.', 401);
  }
}

export async function getFiscalUser(uid: string): Promise<FiscalUser> {
  const snapshot = await adminFirestore.collection('users').doc(uid).get();
  if (!snapshot.exists) {
    throw new FiscalAuthorizationError('Perfil do usuário não encontrado.', 403);
  }
  return { ...snapshot.data(), id: uid } as FiscalUser;
}

export async function requireFiscalAdministrator(uid: string): Promise<FiscalUser> {
  const user = await getFiscalUser(uid);
  if (!isVerifiedAdministrator(user)) {
    throw new FiscalAuthorizationError('Privilégio administrativo fiscal obrigatório.', 403);
  }
  return user;
}

function mapAccess(snapshot: FirebaseFirestore.QueryDocumentSnapshot): UserCompanyAccess {
  return { id: snapshot.id, ...snapshot.data() } as UserCompanyAccess;
}

export async function listAccessibleCompanies(uid: string): Promise<AccessibleCompany[]> {
  const user = await getFiscalUser(uid);
  if (user.status !== 'ATIVO') throw new FiscalAuthorizationError('Usuário inativo.', 403);

  let accesses: UserCompanyAccess[];
  if (isVerifiedAdministrator(user)) {
    const companies = await adminFirestore.collection('clients').get();
    return companies.docs.map((company) => {
      const data = company.data();
      return {
        id: company.id,
        corporateName: data.corporateName || data.companyName || data.razaoSocial || 'Empresa',
        tradeName: data.nomeFantasia || data.tradeName,
        cnpj: data.cnpj || '',
        fiscalPermissions: fullFiscalPermissions(),
      };
    });
  }

  const accessQuery = await adminFirestore
    .collection('userCompanyAccess')
    .where('userId', '==', uid)
    .where('status', '==', 'ATIVO')
    .get();
  accesses = accessQuery.docs.map(mapAccess);

  const companies = await Promise.all(
    accesses.map(async (access): Promise<AccessibleCompany | null> => {
      const company = await adminFirestore.collection('clients').doc(access.clientId).get();
      if (!company.exists) return null;
      const data = company.data() || {};
      return {
        id: company.id,
        corporateName: data.corporateName || data.companyName || data.razaoSocial || 'Empresa',
        tradeName: data.nomeFantasia || data.tradeName,
        cnpj: data.cnpj || '',
        fiscalPermissions: access.fiscalPermissions,
      };
    }),
  );
  const linkedCompanies = companies.filter((company): company is AccessibleCompany => company !== null);
  if (linkedCompanies.length > 0 || String(user.profile || user.role || '').toUpperCase() !== 'CLIENTE') {
    return linkedCompanies;
  }

  // Compatibilidade transitória, somente leitura, com vínculos de clientes já
  // existentes. Não cria documentos nem concede emissão/cancelamento.
  const legacyCnpjs = legacyCompanyCnpjs(user);
  const legacyCompanies = await Promise.all(legacyCnpjs.map(async (cnpj): Promise<AccessibleCompany | null> => {
    const result = await adminFirestore.collection('clients').where('cnpj', '==', cnpj).limit(1).get();
    const company = result.docs[0];
    if (!company) return null;
    const data = company.data();
    return {
      id: company.id,
      corporateName: data.corporateName || data.companyName || data.razaoSocial || 'Empresa',
      tradeName: data.nomeFantasia || data.tradeName,
      cnpj: data.cnpj || '',
      fiscalPermissions: { consultar: true, emitir: false, cancelar: false, administrarCredenciais: false },
    };
  }));
  return legacyCompanies.filter((company): company is AccessibleCompany => company !== null);
}

export async function requireFiscalPermission(
  uid: string,
  clientId: string,
  operation: FiscalOperation,
): Promise<FiscalUser> {
  const user = await getFiscalUser(uid);
  const accessSnapshot = await adminFirestore
    .collection('userCompanyAccess')
    .doc(`${uid}_${clientId}`)
    .get();
  const access = accessSnapshot.exists
    ? ({ id: accessSnapshot.id, ...accessSnapshot.data() } as UserCompanyAccess)
    : null;
  if (access && access.clientId !== clientId) {
    throw new FiscalAuthorizationError('Vínculo empresarial inconsistente.', 403);
  }
  const companySnapshot = await adminFirestore.collection('clients').doc(clientId).get();
  if (!companySnapshot.exists) {
    throw new FiscalAuthorizationError('Empresa não encontrada.', 404);
  }
  authorizeFiscalOperation(user, access, operation);
  return user;
}

export async function requireInternalNfsePermission(uid: string, clientId: string) {
  const user = await getFiscalUser(uid);
  const accessSnapshot = await adminFirestore
    .collection('userCompanyAccess')
    .doc(`${uid}_${clientId}`)
    .get();
  const access = accessSnapshot.exists
    ? ({ id: accessSnapshot.id, ...accessSnapshot.data() } as UserCompanyAccess)
    : null;
  const companySnapshot = await adminFirestore.collection('clients').doc(clientId).get();
  if (!companySnapshot.exists) throw new FiscalAuthorizationError('Empresa não encontrada.', 404);

  authorizeInternalNfseOperation(user, access, clientId);
  return {
    user,
    company: { id: companySnapshot.id, ...companySnapshot.data() } as Record<string, unknown> & { id: string },
  };
}

export async function requireCompanyAccess(uid: string, clientId: string) {
  const user = await getFiscalUser(uid);
  if (user.status !== 'ATIVO') throw new FiscalAuthorizationError('Usuário inativo.', 403);
  const company = await adminFirestore.collection('clients').doc(clientId).get();
  if (!company.exists) throw new FiscalAuthorizationError('Empresa não encontrada.', 404);
  if (!isVerifiedAdministrator(user)) {
    const link = await adminFirestore.collection('userCompanyAccess').doc(`${uid}_${clientId}`).get();
    const data = link.data();
    const canonicalLink = link.exists && data?.userId === uid && data?.clientId === clientId && data?.status === 'ATIVO';
    const companyCnpj = String(company.data()?.cnpj || '');
    const legacyClientAccess = String(user.profile || user.role || '').toUpperCase() === 'CLIENTE'
      && legacyCompanyCnpjs(user).includes(companyCnpj);
    if (!canonicalLink && !legacyClientAccess) {
      throw new FiscalAuthorizationError('Empresa não atribuída ao usuário.', 403);
    }
  }
  return { user, company: { ...(company.data() || {}), id: company.id } as Record<string, unknown> & { id: string } };
}

function legacyCompanyCnpjs(user: FiscalUser): string[] {
  const values = [user.cnpj, ...(user.empresasVinculadas || []).map((company) => company?.cnpj)];
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

export async function recordFiscalAudit(input: {
  actorUid: string;
  actorEmail?: string;
  clientId: string;
  operation: FiscalOperation;
  result: 'PERMITIDO' | 'NEGADO' | 'ERRO' | 'BLOQUEADO_503';
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await adminFirestore.collection('fiscalAuditLogs').add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
  });
}
