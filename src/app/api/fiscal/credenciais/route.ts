import { NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase-admin';
import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import { toPublicCertificateMetadata, type FiscalCertificateMetadata } from '@/lib/fiscal/credentials';
import { recordFiscalAudit, requireCredentialAdministration, requireFirebaseToken } from '@/lib/fiscal/server';

export const runtime = 'nodejs';

function clientIdFrom(request: Request): string {
  return new URL(request.url).searchParams.get('clientId')?.trim() || '';
}

async function recordDeniedAttempt(actorUid: string, clientId: string, action: string): Promise<void> {
  if (!actorUid || !clientId) return;
  try {
    await recordFiscalAudit({
      actorUid,
      clientId,
      operation: 'administrarCredenciais',
      result: 'NEGADO',
      metadata: { action },
    });
  } catch {
    // A indisponibilidade da auditoria não altera nem amplia a decisão de acesso.
  }
}

export async function GET(request: Request) {
  let actorUid = '';
  let clientId = '';
  try {
    const token = await requireFirebaseToken(request);
    actorUid = token.uid;
    clientId = clientIdFrom(request);
    if (!clientId) throw new FiscalAuthorizationError('Empresa obrigatória.', 400);
    await requireCredentialAdministration(token.uid, clientId);

    const snapshot = await adminFirestore.collection('fiscalCredentialMetadata')
      .where('clientId', '==', clientId)
      .get();
    const certificates = snapshot.docs.map((doc) => toPublicCertificateMetadata({
      id: doc.id,
      ...doc.data(),
    } as FiscalCertificateMetadata));
    await recordFiscalAudit({
      actorUid: token.uid,
      actorEmail: token.email,
      clientId,
      operation: 'administrarCredenciais',
      result: 'PERMITIDO',
      metadata: { action: 'LISTAR_METADADOS', count: certificates.length },
    });
    return NextResponse.json({ certificates, uploadEnabled: false });
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) {
      await recordDeniedAttempt(actorUid, clientId, 'LISTAR_METADADOS');
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Falha ao consultar metadados de credenciais.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let actorUid = '';
  let clientId = '';
  try {
    const token = await requireFirebaseToken(request);
    actorUid = token.uid;
    clientId = clientIdFrom(request);
    if (!clientId) throw new FiscalAuthorizationError('Empresa obrigatória.', 400);
    await requireCredentialAdministration(token.uid, clientId);
    await recordFiscalAudit({
      actorUid: token.uid,
      actorEmail: token.email,
      clientId,
      operation: 'administrarCredenciais',
      result: 'BLOQUEADO_503',
      metadata: { action: 'UPLOAD_CERTIFICADO', reason: 'SPRINT_3_2A' },
    });
    return NextResponse.json(
      { error: 'Cadastro e upload de certificados permanecem desabilitados nesta Sprint.' },
      { status: 503 },
    );
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) {
      await recordDeniedAttempt(actorUid, clientId, 'UPLOAD_CERTIFICADO');
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Falha ao validar a operação de credenciais.' }, { status: 500 });
  }
}
