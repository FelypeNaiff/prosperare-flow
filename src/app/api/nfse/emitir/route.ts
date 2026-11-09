import { NextResponse } from 'next/server';

import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import {
  recordFiscalAudit,
  requireFirebaseToken,
  requireFiscalPermission,
} from '@/lib/fiscal/server';

export const runtime = 'nodejs';

interface EmitirNfseBody {
  clientId?: string;
}

// A emissão real permanece bloqueada até a homologação da integração oficial e
// a disponibilização de um cofre de segredos no servidor. PFX e senha nunca
// devem ser enviados pelo navegador nem persistidos no Firestore.
export async function POST(request: Request) {
  let token: Awaited<ReturnType<typeof requireFirebaseToken>> | null = null;
  let clientId = '';

  try {
    token = await requireFirebaseToken(request);
    const body = (await request.json()) as EmitirNfseBody;
    clientId = typeof body.clientId === 'string' ? body.clientId : '';
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Empresa não informada.' }, { status: 400 });
    }

    await requireFiscalPermission(token.uid, clientId, 'emitir');
    await recordFiscalAudit({
      actorUid: token.uid,
      actorEmail: token.email,
      clientId,
      operation: 'emitir',
      result: 'BLOQUEADO_503',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Emissão fiscal indisponível até a homologação da integração oficial.',
      },
      { status: 503 },
    );
  } catch (error) {
    if (token && clientId) {
      await recordFiscalAudit({
        actorUid: token.uid,
        actorEmail: token.email,
        clientId,
        operation: 'emitir',
        result: 'NEGADO',
      }).catch(() => undefined);
    }
    if (error instanceof FiscalAuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Erro interno na autorização fiscal.' }, { status: 500 });
  }
}
