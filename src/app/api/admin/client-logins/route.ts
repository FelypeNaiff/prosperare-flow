import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import { requireFirebaseToken, requireFiscalAdministrator } from '@/lib/fiscal/server';

export const runtime = 'nodejs';

type ClientLoginBody = {
  userId?: string;
  fullName?: string;
  email?: string;
  password?: string;
  clientIds?: string[];
  status?: 'ATIVO' | 'INATIVO';
};

function normalizedClientIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))].slice(0, 100);
}

async function loadCompanies(clientIds: string[]) {
  if (clientIds.length === 0) throw new FiscalAuthorizationError('Informe ao menos uma empresa.', 400);
  const companies = await Promise.all(clientIds.map((id) => adminFirestore.collection('clients').doc(id).get()));
  if (companies.some((company) => !company.exists)) throw new FiscalAuthorizationError('Empresa selecionada não encontrada.', 400);
  return companies;
}

function embeddedCompanies(companies: FirebaseFirestore.DocumentSnapshot[]) {
  return companies.map((company) => {
    const data = company.data() || {};
    return {
      cnpj: data.cnpj || '',
      companyName: data.nomeFantasia || data.corporateName || data.razaoSocial || '',
      razaoSocial: data.razaoSocial || data.corporateName || data.nomeFantasia || '',
    };
  });
}

function replaceLinks(
  transaction: FirebaseFirestore.Transaction,
  userId: string,
  clientIds: string[],
  previous: FirebaseFirestore.QueryDocumentSnapshot[] = [],
) {
  previous.forEach((link) => transaction.delete(link.ref));
  clientIds.forEach((clientId) => transaction.set(
    adminFirestore.collection('userCompanyAccess').doc(`${userId}_${clientId}`),
    {
      userId,
      clientId,
      kind: 'CLIENTE',
      status: 'ATIVO',
      fiscalPermissions: { consultar: true, emitir: false, cancelar: false, administrarCredenciais: false },
      updatedAt: FieldValue.serverTimestamp(),
    },
  ));
}

export async function POST(request: Request) {
  let createdUid: string | null = null;
  try {
    const token = await requireFirebaseToken(request);
    await requireFiscalAdministrator(token.uid);
    const body = (await request.json()) as ClientLoginBody;
    const fullName = String(body.fullName || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const clientIds = normalizedClientIds(body.clientIds);
    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: 'Nome, e-mail e senha válida são obrigatórios.' }, { status: 400 });
    }
    const companies = await loadCompanies(clientIds);
    const first = companies[0].data() || {};
    const authUser = await adminAuth.createUser({ email, password, displayName: fullName, disabled: false });
    createdUid = authUser.uid;
    await adminFirestore.runTransaction(async (transaction) => {
      transaction.create(adminFirestore.collection('users').doc(authUser.uid), {
        id: authUser.uid,
        fullName,
        email,
        profile: 'CLIENTE',
        status: 'ATIVO',
        fiscalAdmin: false,
        cnpj: first.cnpj || '',
        companyName: first.nomeFantasia || first.corporateName || first.razaoSocial || '',
        empresasVinculadas: embeddedCompanies(companies),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: token.uid,
      });
      replaceLinks(transaction, authUser.uid, clientIds);
    });
    await audit(token.uid, authUser.uid, 'CRIAR_LOGIN_CLIENTE', { clientIds, email });
    return NextResponse.json({ success: true, userId: authUser.uid }, { status: 201 });
  } catch (error) {
    if (createdUid) await adminAuth.deleteUser(createdUid).catch(() => undefined);
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    await requireFiscalAdministrator(token.uid);
    const body = (await request.json()) as ClientLoginBody;
    const userId = String(body.userId || '');
    const target = await adminFirestore.collection('users').doc(userId).get();
    if (!target.exists || String(target.data()?.profile || target.data()?.role || '').toUpperCase() !== 'CLIENTE') {
      return NextResponse.json({ error: 'Login de cliente não encontrado.' }, { status: 404 });
    }

    if (body.status) {
      const status = body.status === 'ATIVO' ? 'ATIVO' : 'INATIVO';
      await adminAuth.updateUser(userId, { disabled: status !== 'ATIVO' });
      await target.ref.update({ status, updatedAt: FieldValue.serverTimestamp(), updatedBy: token.uid });
      await audit(token.uid, userId, 'ALTERAR_STATUS_LOGIN_CLIENTE', { status });
      return NextResponse.json({ success: true });
    }

    const fullName = String(body.fullName || '').trim().toUpperCase();
    const clientIds = normalizedClientIds(body.clientIds);
    if (!fullName) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 });
    const companies = await loadCompanies(clientIds);
    const first = companies[0].data() || {};
    const previousLinks = await adminFirestore.collection('userCompanyAccess').where('userId', '==', userId).get();
    await adminAuth.updateUser(userId, { displayName: fullName });
    await adminFirestore.runTransaction(async (transaction) => {
      transaction.update(target.ref, {
        fullName,
        cnpj: first.cnpj || '',
        companyName: first.nomeFantasia || first.corporateName || first.razaoSocial || '',
        empresasVinculadas: embeddedCompanies(companies),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: token.uid,
      });
      replaceLinks(transaction, userId, clientIds, previousLinks.docs);
    });
    await audit(token.uid, userId, 'ATUALIZAR_LOGIN_CLIENTE', { clientIds });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    await requireFiscalAdministrator(token.uid);
    const userId = new URL(request.url).searchParams.get('userId') || '';
    if (!userId || userId === token.uid) return NextResponse.json({ error: 'Usuário inválido.' }, { status: 400 });
    const target = await adminFirestore.collection('users').doc(userId).get();
    if (!target.exists || String(target.data()?.profile || '').toUpperCase() !== 'CLIENTE') {
      return NextResponse.json({ error: 'Login de cliente não encontrado.' }, { status: 404 });
    }
    await adminAuth.updateUser(userId, { disabled: true });
    const links = await adminFirestore.collection('userCompanyAccess').where('userId', '==', userId).get();
    await adminFirestore.runTransaction(async (transaction) => {
      links.docs.forEach((link) => transaction.delete(link.ref));
      transaction.delete(target.ref);
    });
    await adminAuth.deleteUser(userId);
    await audit(token.uid, userId, 'EXCLUIR_LOGIN_CLIENTE', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

async function audit(actorUid: string, targetUserId: string, action: string, metadata: Record<string, unknown>) {
  await adminFirestore.collection('adminAuditLogs').add({ actorUid, targetUserId, action, metadata, createdAt: FieldValue.serverTimestamp() });
}

function errorResponse(error: unknown) {
  if (error instanceof FiscalAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('email-already-exists')) return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
  return NextResponse.json({ error: 'Falha na gestão do login de cliente.' }, { status: 500 });
}
