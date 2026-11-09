import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase-admin';
import {
  AccessProfilePermissionsError,
  parseAccessProfilePermissions,
} from '@/lib/fiscal/access-profile-permissions';
import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import { requireFirebaseToken, requireFiscalAdministrator } from '@/lib/fiscal/server';

export const runtime = 'nodejs';

const PROTECTED = new Set(['socio', 'administrador', 'supervisor', 'contador_gestor', 'assistente']);

export async function PUT(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    await requireFiscalAdministrator(token.uid);
    const body = await request.json() as { id?: string; name?: string; description?: string; permissions?: Record<string, unknown> };
    const id = String(body.id || '').trim();
    const name = String(body.name || '').trim();
    if (!/^[a-z0-9_]+$/.test(id) || !name || !body.permissions || typeof body.permissions !== 'object') {
      return NextResponse.json({ error: 'Perfil de acesso inválido.' }, { status: 400 });
    }
    const permissions = parseAccessProfilePermissions(body.permissions);
    await adminFirestore.collection('accessProfiles').doc(id).set({
      id, name: name.toUpperCase(), description: String(body.description || ''), permissions,
      updatedAt: FieldValue.serverTimestamp(), updatedBy: token.uid,
    }, { merge: true });
    await adminFirestore.collection('adminAuditLogs').add({
      actorUid: token.uid, action: 'SALVAR_PERFIL_ACESSO', profileId: id, createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AccessProfilePermissionsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof FiscalAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Falha ao salvar perfil.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    await requireFiscalAdministrator(token.uid);
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!/^[a-z0-9_]+$/.test(id) || PROTECTED.has(id)) {
      return NextResponse.json({ error: 'Perfil protegido ou inválido.' }, { status: 400 });
    }
    await adminFirestore.collection('accessProfiles').doc(id).delete();
    await adminFirestore.collection('adminAuditLogs').add({
      actorUid: token.uid, action: 'EXCLUIR_PERFIL_ACESSO', profileId: id, createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Falha ao excluir perfil.' }, { status: 500 });
  }
}
