import assert from 'node:assert/strict';
import test from 'node:test';

import { assertMigrationWriteAllowed, resolveCompany, userCompanyCandidates } from './migration';

const ids = new Set(['empresa-a', 'empresa-b']);
const byCnpj = new Map([['11111111000111', ['empresa-a']], ['22222222000122', ['empresa-a', 'empresa-b']]]);

test('resolve somente identificadores empresariais confiáveis e únicos', () => {
  assert.deepEqual(resolveCompany({ clientId: 'empresa-a' }, ids, byCnpj), { status: 'resolved', clientId: 'empresa-a', source: 'client-id' });
  assert.equal(resolveCompany({ cnpj: '11.111.111/0001-11' }, ids, byCnpj).status, 'resolved');
  assert.equal(resolveCompany({ cnpj: '22.222.222/0001-22' }, ids, byCnpj).status, 'ambiguous');
  assert.equal(resolveCompany({ clientId: 'empresa-a', empresaId: 'empresa-b' }, ids, byCnpj).status, 'ambiguous');
  assert.equal(resolveCompany({ nome: 'Empresa A' }, ids, byCnpj).status, 'unresolved');
});

test('gera candidatos de vínculos sem inferir empresa por nome', () => {
  const candidates = userCompanyCandidates({ clientIds: ['empresa-a'], empresasVinculadas: [{ cnpj: '22.222.222/0001-22' }], companyName: 'Empresa B' }, ids, byCnpj);
  assert.deepEqual(candidates.map((item) => item.status), ['resolved', 'ambiguous']);
});

test('modo apply exige duas autorizações explícitas', () => {
  assert.doesNotThrow(() => assertMigrationWriteAllowed(false, false));
  assert.throws(() => assertMigrationWriteAllowed(true, false), /Aplicação bloqueada/);
  assert.doesNotThrow(() => assertMigrationWriteAllowed(true, true));
});
