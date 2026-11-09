import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizeCredentialAdministration, fullFiscalPermissions } from './authorization';
import {
  CredentialValidationError,
  sanitizeCredentialAuditMetadata,
  toPublicCertificateMetadata,
  validateSyntheticCertificate,
  type FiscalCertificateMetadata,
  type SyntheticCertificateInspection,
} from './credentials';
import type { FiscalUser, UserCompanyAccess } from './types';

const companyId = 'empresa-1';
const cnpj = '12345678000190';
const baseInspection: SyntheticCertificateInspection = {
  holderCnpj: cnpj,
  serialNumber: 'SINTETICO-001',
  issuer: 'AC TESTE SINTETICA',
  validFrom: '2026-01-01T00:00:00.000Z',
  expiresAt: '2027-01-01T00:00:00.000Z',
  revoked: false,
};

function user(id: string, profile = 'ASSISTENTE'): FiscalUser {
  return { id, profile, status: 'ATIVO' };
}

function access(uid: string, clientId = companyId, allowed = true): UserCompanyAccess {
  return {
    id: `${uid}_${clientId}`,
    userId: uid,
    clientId,
    kind: 'FUNCIONARIO',
    status: 'ATIVO',
    fiscalPermissions: { ...fullFiscalPermissions(), administrarCredenciais: allowed },
  };
}

test('aceita metadados de certificado sintético válido', () => {
  assert.equal(validateSyntheticCertificate(baseInspection, cnpj, new Date('2026-06-01')), 'VALIDO');
});

test('identifica certificado sintético vencido', () => {
  assert.equal(validateSyntheticCertificate(baseInspection, cnpj, new Date('2027-02-01')), 'VENCIDO');
});

test('rejeita CNPJ incompatível', () => {
  assert.throws(() => validateSyntheticCertificate(baseInspection, '00999999000100'), CredentialValidationError);
});

test('identifica certificado sintético revogado', () => {
  assert.equal(validateSyntheticCertificate({ ...baseInspection, revoked: true }, cnpj), 'REVOGADO');
});

test('funcionário autorizado administra credenciais da empresa vinculada', () => {
  assert.doesNotThrow(() => authorizeCredentialAdministration(user('funcionario'), access('funcionario'), companyId));
});

test('funcionário sem permissão é negado', () => {
  assert.throws(() => authorizeCredentialAdministration(user('funcionario'), access('funcionario', companyId, false), companyId));
});

test('cliente é negado mesmo com a permissão indevidamente concedida', () => {
  assert.throws(() => authorizeCredentialAdministration(user('cliente', 'CLIENTE'), { ...access('cliente'), kind: 'CLIENTE' }, companyId), /restritas à equipe/);
});

test('acesso cruzado entre empresas é negado', () => {
  assert.throws(() => authorizeCredentialAdministration(user('funcionario'), access('funcionario', 'empresa-2'), companyId), /Acesso cruzado/);
});

test('administrador fiscal explícito possui acesso transversal', () => {
  assert.doesNotThrow(() => authorizeCredentialAdministration({ ...user('admin', 'ADMINISTRADOR'), fiscalAdmin: true }, null, companyId));
});

test('respostas e auditoria não expõem referências ou segredos', () => {
  const metadata: FiscalCertificateMetadata = {
    id: 'cert-1', clientId: companyId, holderCnpj: cnpj, serialNumber: 'SINTETICO-001',
    issuer: 'AC TESTE SINTETICA', validFrom: baseInspection.validFrom, expiresAt: baseInspection.expiresAt,
    status: 'VALIDO', secureStorageRef: 'gs://privado/objeto-cifrado', createdAt: '2026-01-01T00:00:00.000Z',
  };
  const publicMetadata = toPublicCertificateMetadata({ ...metadata, password: 'inesperado', pfx: 'bytes' } as FiscalCertificateMetadata);
  assert.equal('secureStorageRef' in publicMetadata, false);
  assert.equal('password' in publicMetadata, false);
  assert.equal('pfx' in publicMetadata, false);
  const audit = sanitizeCredentialAuditMetadata({ clientId: companyId, password: 'segredo', pfx: 'bytes', privateKey: 'chave', result: 'VALIDO' });
  assert.deepEqual(audit, { clientId: companyId, result: 'VALIDO' });
});
