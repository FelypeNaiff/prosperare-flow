import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { after, before, beforeEach } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, documentId, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

const projectId = 'prosperare-sprint-2-1-test';
let env: RulesTestEnvironment;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8088,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

after(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const seed = async (path: string, value: Record<string, unknown>) => setDoc(doc(db, path), value);
    await Promise.all([
      seed('users/client-a', { status: 'ATIVO', profile: 'CLIENTE' }),
      seed('users/client-b', { status: 'ATIVO', role: 'CLIENTE' }),
      seed('users/employee-ok', { status: 'ATIVO', profile: 'ASSISTENTE' }),
      seed('users/employee-role', { status: 'ATIVO', role: 'ASSISTENTE' }),
      seed('users/employee-no-finance', { status: 'ATIVO', profile: 'ASSISTENTE' }),
      seed('users/admin', { status: 'ATIVO', profile: 'ADMINISTRADOR', fiscalAdmin: true }),
      seed('users/admin-no-fiscal', { status: 'ATIVO', profile: 'ADMINISTRADOR', fiscalAdmin: false }),
      seed('accessProfiles/assistente', { permissions: { view_clients: true, view_tasks: true, manage_tasks: true, view_passwords: true, financeiro: true, processos: true, funcionarios: true, docs_flow: true, irpf: true } }),
      seed('clients/company-a', { corporateName: 'Empresa A', cnpj: '11111111000111' }),
      seed('clients/company-b', { corporateName: 'Empresa B', cnpj: '22222222000122' }),
      seed('userCompanyAccess/client-a_company-a', link('client-a', 'company-a', 'CLIENTE')),
      seed('userCompanyAccess/client-b_company-b', link('client-b', 'company-b', 'CLIENTE')),
      seed('userCompanyAccess/employee-ok_company-a', link('employee-ok', 'company-a', 'FUNCIONARIO')),
      seed('userCompanyAccess/employee-role_company-a', link('employee-role', 'company-a', 'FUNCIONARIO')),
      seed('userCompanyAccess/employee-no-finance_company-a', link('employee-no-finance', 'company-a', 'FUNCIONARIO')),
      seed('tasks/task-a', { canonicalClientId: 'company-a', title: 'A' }),
      seed('tasks/task-b', { canonicalClientId: 'company-b', title: 'B' }),
      seed('clientAccesses/access-a', { clientId: 'company-a', login: 'secret-a' }),
      seed('clientAccesses/access-b', { clientId: 'company-b', login: 'secret-b' }),
      seed('receivables/receivable-a', { clientId: 'company-a', value: 10 }),
      seed('receivables/receivable-b', { clientId: 'company-b', value: 20 }),
      seed('societaryAlterations/alteration-a', { canonicalClientId: 'company-a', clientId: 'company-a' }),
      seed('societaryAlterations/alteration-b', { canonicalClientId: 'company-b', clientId: 'company-b' }),
      seed('societaryOpenings/opening-own', { createdBy: 'employee-ok', companyName: 'Em constituição' }),
      seed('societaryOpenings/opening-other', { createdBy: 'employee-role', companyName: 'Outra abertura' }),
      seed('irpf_declarations/irpf-a', { canonicalClientId: 'company-a', clientId: 'company-a', name: 'Pessoa A' }),
      seed('irpf_declarations/irpf-b', { canonicalClientId: 'company-b', clientId: 'company-b', name: 'Pessoa B' }),
      seed('irpf_declarations/irpf-legacy-secret', { canonicalClientId: 'company-a', clientId: 'company-a', name: 'Legado', govPass: 'nunca-expor' }),
      seed('payables/payable-office', { value: 30 }),
      seed('officeSettings/main', { companyName: 'Prosperare' }),
    ]);
    await updateDoc(doc(db, 'accessProfiles/assistente'), { permissions: { view_clients: true, view_tasks: true, manage_tasks: true, view_passwords: true, financeiro: true, processos: true, funcionarios: true, docs_flow: true, irpf: true } });
    await seed('accessProfiles/sem_financeiro', { permissions: { view_clients: true } });
    await updateDoc(doc(db, 'users/employee-no-finance'), { profile: 'sem_financeiro' });
  });
});

test('não autenticado não lê empresas nem configurações', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'clients/company-a')));
  await assertFails(getDoc(doc(db, 'officeSettings/main')));
});

test('cliente lê somente empresa vinculada e não escreve diretamente', async () => {
  const db = env.authenticatedContext('client-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'clients/company-a')));
  await assertFails(getDoc(doc(db, 'clients/company-b')));
  await assertFails(updateDoc(doc(db, 'clients/company-a'), { corporateName: 'Alterada' }));
  await assertFails(getDoc(doc(db, 'tasks/task-a'))); // Portal usa API autenticada.
  await assertSucceeds(getDoc(doc(db, 'officeSettings/main')));
});

test('funcionário com profile ou role opcional mantém acesso apenas à empresa atribuída', async () => {
  for (const uid of ['employee-ok', 'employee-role']) {
    const db = env.authenticatedContext(uid).firestore();
    await assertSucceeds(getDoc(doc(db, 'clients/company-a')));
    await assertFails(getDoc(doc(db, 'clients/company-b')));
    await assertSucceeds(getDoc(doc(db, 'tasks/task-a')));
    await assertFails(getDoc(doc(db, 'tasks/task-b')));
  }
});

test('consultas da equipe precisam filtrar pela empresa autorizada', async () => {
  const db = env.authenticatedContext('employee-ok').firestore();
  await assertSucceeds(getDocs(query(collection(db, 'tasks'), where('canonicalClientId', '==', 'company-a'))));
  await assertSucceeds(getDocs(query(collection(db, 'tasks'), where('canonicalClientId', 'in', ['company-a']))));
  await assertSucceeds(getDocs(query(collection(db, 'clients'), where(documentId(), 'in', ['company-a']))));
  await assertFails(getDocs(query(collection(db, 'tasks'), where('canonicalClientId', 'in', ['company-a', 'company-b']))));
  await assertFails(getDocs(collection(db, 'tasks')));
});

test('cofre exige privilégio próprio e vínculo; escrita continua administrativa', async () => {
  const db = env.authenticatedContext('employee-ok').firestore();
  await assertSucceeds(getDoc(doc(db, 'clientAccesses/access-a')));
  await assertFails(getDoc(doc(db, 'clientAccesses/access-b')));
  await assertFails(updateDoc(doc(db, 'clientAccesses/access-a'), { login: 'changed' }));
});

test('financeiro exige permissão e vínculo; contas internas ficam administrativas', async () => {
  const allowed = env.authenticatedContext('employee-ok').firestore();
  const denied = env.authenticatedContext('employee-no-finance').firestore();
  await assertSucceeds(getDoc(doc(allowed, 'receivables/receivable-a')));
  await assertFails(getDoc(doc(allowed, 'receivables/receivable-b')));
  await assertFails(getDoc(doc(allowed, 'payables/payable-office')));
  await assertFails(getDoc(doc(denied, 'receivables/receivable-a')));
});

test('alteração societária exige permissão de processos e vínculo', async () => {
  const allowed = env.authenticatedContext('employee-ok').firestore();
  await assertSucceeds(getDoc(doc(allowed, 'societaryAlterations/alteration-a')));
  await assertFails(getDoc(doc(allowed, 'societaryAlterations/alteration-b')));
});

test('abertura sem cliente cadastrado fica restrita ao criador ou administrador', async () => {
  const employee = env.authenticatedContext('employee-ok').firestore();
  const admin = env.authenticatedContext('admin').firestore();
  await assertSucceeds(getDoc(doc(employee, 'societaryOpenings/opening-own')));
  await assertFails(getDoc(doc(employee, 'societaryOpenings/opening-other')));
  await assertSucceeds(getDoc(doc(admin, 'societaryOpenings/opening-other')));
});

test('IRPF exige permissão própria e vínculo empresarial', async () => {
  const employee = env.authenticatedContext('employee-ok').firestore();
  const admin = env.authenticatedContext('admin').firestore();
  await assertSucceeds(getDoc(doc(employee, 'irpf_declarations/irpf-a')));
  await assertFails(getDoc(doc(employee, 'irpf_declarations/irpf-b')));
  await assertFails(getDoc(doc(employee, 'irpf_declarations/irpf-legacy-secret')));
  await assertFails(getDoc(doc(admin, 'irpf_declarations/irpf-legacy-secret')));
  await assertFails(setDoc(doc(employee, 'irpf_declarations/irpf-new-secret'), { canonicalClientId: 'company-a', govPass: 'segredo' }));
  await assertFails(getDocs(collection(employee, 'irpf_declarations')));
  await assertSucceeds(getDocs(query(collection(employee, 'irpf_declarations'), where('canonicalClientId', 'in', ['company-a']))));
});

test('somente administrador fiscal explícito recebe acesso transversal', async () => {
  const admin = env.authenticatedContext('admin').firestore();
  const regularAdmin = env.authenticatedContext('admin-no-fiscal').firestore();
  await assertSucceeds(getDoc(doc(admin, 'clients/company-b')));
  await assertFails(getDoc(doc(regularAdmin, 'clients/company-b')));
});

test('navegador não altera vínculos nem eleva o próprio perfil', async () => {
  const employee = env.authenticatedContext('employee-ok').firestore();
  const admin = env.authenticatedContext('admin').firestore();
  await assertFails(setDoc(doc(employee, 'userCompanyAccess/employee-ok_company-b'), link('employee-ok', 'company-b', 'FUNCIONARIO')));
  await assertFails(updateDoc(doc(admin, 'users/admin'), { fiscalAdmin: false }));
  await assertFails(updateDoc(doc(admin, 'users/employee-ok'), { profile: 'ADMINISTRADOR', fiscalAdmin: true }));
});

test('vínculo inconsistente não autoriza empresa', async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'userCompanyAccess/client-a_company-b'), link('client-a', 'company-a', 'CLIENTE'));
  });
  const db = env.authenticatedContext('client-a').firestore();
  await assertFails(getDoc(doc(db, 'clients/company-b')));
});

function link(userId: string, clientId: string, kind: 'CLIENTE' | 'FUNCIONARIO') {
  return {
    userId, clientId, kind, status: 'ATIVO',
    fiscalPermissions: { consultar: true, emitir: true, cancelar: false, administrarCredenciais: false },
  };
}
