import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase-admin';
import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import {
  requireFirebaseToken,
  requireFiscalAdministrator,
} from '@/lib/fiscal/server';
import { FISCAL_OPERATIONS, type FiscalPermissions } from '@/lib/fiscal/types';

export const runtime = 'nodejs';

const ADMIN_PROFILES = new Set(['ADMINISTRADOR', 'SÓCIO', 'SOCIO']);
const ALLOWED_PROFILES = new Set([
  'CLIENTE', 'ASSISTENTE', 'CONTADOR_GESTOR', 'SUPERVISOR',
  'ADMINISTRADOR', 'SÓCIO', 'SOCIO',
]);

interface RequestBody {
  action?: 'setProfile' | 'upsertAccess' | 'deleteAccess';
  userId?: string;
  profile?: string;
  fiscalAdmin?: boolean;
  clientId?: string;
  kind?: 'CLIENTE' | 'FUNCIONARIO';
  fiscalPermissions?: FiscalPermissions;
}

function isPermissions(value: unknown): value is FiscalPermissions {
  if (!value || typeof value !== 'object') return false;
  return FISCAL_OPERATIONS.every((operation) => typeof (value as Record<string, unknown>)[operation] === 'boolean');
}

export async function PATCH(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    await requireFiscalAdministrator(token.uid);
    const body = (await request.json()) as RequestBody;

    if (!body.action || typeof body.userId !== 'string' || !body.userId) {
      return NextResponse.json({ error: 'Solicitação administrativa inválida.' }, { status: 400 });
    }

    const targetRef = adminFirestore.collection('users').doc(body.userId);
    const target = await targetRef.get();
    if (!target.exists) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

    if (body.action === 'setProfile') {
      const profile = String(body.profile || '').trim().toUpperCase();
      if (!ALLOWED_PROFILES.has(profile)) {
        return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 });
      }
      const current = target.data() || {};
      const changesAdminState = ADMIN_PROFILES.has(profile) || body.fiscalAdmin === true;
      if (body.userId === token.uid && changesAdminState) {
        return NextResponse.json({ error: 'Autoelevação administrativa não é permitida.' }, { status: 403 });
      }
      // Um administrador fiscal pode delegar somente por esta API auditada.
      await targetRef.update({
        profile,
        fiscalAdmin: ADMIN_PROFILES.has(profile) && body.fiscalAdmin === true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await audit(token.uid, body.userId, 'ALTERAR_PERFIL', { previousProfile: current.profile || current.role || null, profile });
      return NextResponse.json({ success: true });
    }

    if (typeof body.clientId !== 'string' || !body.clientId) {
      return NextResponse.json({ error: 'Empresa não informada.' }, { status: 400 });
    }
    const company = await adminFirestore.collection('clients').doc(body.clientId).get();
    if (!company.exists) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
    const linkId = `${body.userId}_${body.clientId}`;
    const linkRef = adminFirestore.collection('userCompanyAccess').doc(linkId);

    if (body.action === 'deleteAccess') {
      await linkRef.delete();
      await audit(token.uid, body.userId, 'REMOVER_VINCULO', { clientId: body.clientId });
      return NextResponse.json({ success: true });
    }

    if (body.action !== 'upsertAccess' || !isPermissions(body.fiscalPermissions)
      || !['CLIENTE', 'FUNCIONARIO'].includes(String(body.kind))) {
      return NextResponse.json({ error: 'Vínculo ou permissões inválidos.' }, { status: 400 });
    }
    await linkRef.set({
      userId: body.userId,
      clientId: body.clientId,
      kind: body.kind,
      status: 'ATIVO',
      fiscalPermissions: body.fiscalPermissions,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: token.uid,
    }, { merge: true });
    await audit(token.uid, body.userId, 'ATUALIZAR_VINCULO', { clientId: body.clientId });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Falha na operação administrativa.' }, { status: 500 });
  }
}

async function audit(actorUid: string, targetUserId: string, action: string, metadata: Record<string, unknown>) {
  await adminFirestore.collection('adminAuditLogs').add({
    actorUid, targetUserId, action, metadata, createdAt: FieldValue.serverTimestamp(),
  });
}
