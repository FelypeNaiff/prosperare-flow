import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase-admin';
import { FiscalAuthorizationError } from '@/lib/fiscal/authorization';
import { requireCompanyAccess, requireFirebaseToken } from '@/lib/fiscal/server';

export const runtime = 'nodejs';

const TYPES = new Set(['FERIAS', 'RESCISAO']);

export async function GET(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId') || '';
    const type = (url.searchParams.get('type') || '').toUpperCase();
    if (!clientId || !TYPES.has(type)) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 });
    const { company } = await requireCompanyAccess(token.uid, clientId);
    const cnpj = String(company.cnpj || '');
    const tasks = await adminFirestore.collection('tasks')
      .where('clientId', '==', cnpj)
      .where('origem', '==', 'PORTAL_CLIENTE')
      .where('tipo', '==', type)
      .get();
    const employeeResult = await adminFirestore.collection('funcionarios')
      .where('clientCnpj', '==', cnpj)
      .where('status', '==', 'ATIVO')
      .get();
    const employees = employeeResult.docs;
    return NextResponse.json({
      requests: tasks.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      employees: employees.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Falha ao carregar dados do portal.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = await requireFirebaseToken(request);
    const body = await request.json() as { clientId?: string; type?: string; data?: Record<string, unknown> };
    const clientId = typeof body.clientId === 'string' ? body.clientId : '';
    const type = String(body.type || '').toUpperCase();
    if (!clientId || !TYPES.has(type) || !body.data || typeof body.data !== 'object') {
      return NextResponse.json({ error: 'Solicitação inválida.' }, { status: 400 });
    }
    const { company } = await requireCompanyAccess(token.uid, clientId);
    const cnpj = String(company.cnpj || '');
    const safeData = sanitizePortalTask(body.data);
    const task = await adminFirestore.collection('tasks').add({
      ...safeData,
      clientId: cnpj,
      canonicalClientId: clientId,
      origem: 'PORTAL_CLIENTE',
      tipo: type,
      requestedByUid: token.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, id: task.id }, { status: 201 });
  } catch (error) {
    if (error instanceof FiscalAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Falha ao registrar solicitação.' }, { status: 500 });
  }
}

function sanitizePortalTask(data: Record<string, unknown>) {
  const allowed = [
    'title', 'titulo', 'description', 'descricao', 'notes', 'status', 'priority', 'prazo',
    'clientName', 'responsibleId', 'responsibleName', 'departamento',
    'solicitante', 'funcionarioId', 'funcionarioNome', 'tipoAviso',
    'dataInicioAviso', 'dataInicio', 'dataFim', 'dataRetorno', 'observacoes', 'lotacao',
    'dias', 'abonoPecuniario', 'diasAbono', 'adiantamento13',
  ];
  return Object.fromEntries(allowed.filter((key) => key in data).map((key) => [key, data[key]]));
}
