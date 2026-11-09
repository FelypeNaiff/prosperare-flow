import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FiscalAuthorizationError,
  authorizeFiscalOperation,
  fullFiscalPermissions,
} from './authorization';
import type { FiscalUser, UserCompanyAccess } from './types';

const companyId = 'empresa-1';

function user(id: string, profile: string): FiscalUser {
  return { id, profile, status: 'ATIVO' };
}

function access(uid: string, permissions = fullFiscalPermissions()): UserCompanyAccess {
  return {
    id: `${uid}_${companyId}`,
    userId: uid,
    clientId: companyId,
    kind: 'CLIENTE',
    status: 'ATIVO',
    fiscalPermissions: permissions,
  };
}

test('cliente autorizado pode executar a operação concedida', () => {
  assert.doesNotThrow(() => authorizeFiscalOperation(user('cliente', 'CLIENTE'), access('cliente'), 'emitir'));
});

test('cliente não autorizado é negado', () => {
  assert.throws(
    () => authorizeFiscalOperation(user('cliente', 'CLIENTE'), null, 'consultar'),
    (error) => error instanceof FiscalAuthorizationError && error.status === 403,
  );
});

test('funcionário autorizado pode operar empresa atribuída', () => {
  const employeeAccess = { ...access('funcionario'), kind: 'FUNCIONARIO' as const };
  assert.doesNotThrow(() => authorizeFiscalOperation(user('funcionario', 'ASSISTENTE'), employeeAccess, 'cancelar'));
});

test('funcionário sem a permissão explícita é negado', () => {
  const permissions = { ...fullFiscalPermissions(), cancelar: false };
  assert.throws(
    () => authorizeFiscalOperation(user('funcionario', 'ASSISTENTE'), access('funcionario', permissions), 'cancelar'),
    FiscalAuthorizationError,
  );
});

test('administrador ativo é autorizado pelo perfil verificado no servidor', () => {
  assert.doesNotThrow(() => authorizeFiscalOperation({ ...user('admin', 'ADMINISTRADOR'), fiscalAdmin: true }, null, 'administrarCredenciais'));
});

test('perfil administrativo sem privilégio fiscal explícito não ignora vínculos', () => {
  assert.throws(() => authorizeFiscalOperation(user('admin', 'ADMINISTRADOR'), null, 'consultar'), FiscalAuthorizationError);
});

test('vínculo com id inconsistente é negado', () => {
  const inconsistent = { ...access('cliente'), id: 'outro-id' };
  assert.throws(() => authorizeFiscalOperation(user('cliente', 'CLIENTE'), inconsistent, 'consultar'), FiscalAuthorizationError);
});

test('usuário não autenticado recebe 401', () => {
  assert.throws(
    () => authorizeFiscalOperation(null, null, 'consultar'),
    (error) => error instanceof FiscalAuthorizationError && error.status === 401,
  );
});
