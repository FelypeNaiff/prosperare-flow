import { NextResponse } from 'next/server';

import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import { listAccessibleCompanies, requireFirebaseToken } from '@/lib/fiscal/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    const companies = await listAccessibleCompanies(token.uid);
    return NextResponse.json({ companies });
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Falha ao listar empresas autorizadas.' }, { status: 500 });
  }
}
