import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCESS_PROFILE_PERMISSION_IDS,
  AccessProfilePermissionsError,
  parseAccessProfilePermissions,
} from './access-profile-permissions';

test('preserva as permissões funcionarios e irpf no salvamento e na leitura', () => {
  const saved = parseAccessProfilePermissions({
    funcionarios: true,
    irpf: false,
    processos: true,
  });

  assert.deepEqual(saved, {
    funcionarios: true,
    irpf: false,
    processos: true,
  });
  assert.equal(saved.funcionarios, true);
  assert.equal(saved.irpf, false);
  assert.ok(ACCESS_PROFILE_PERMISSION_IDS.includes('funcionarios'));
  assert.ok(ACCESS_PROFILE_PERMISSION_IDS.includes('irpf'));
});

test('rejeita explicitamente permissões desconhecidas sem remoção silenciosa', () => {
  assert.throws(
    () => parseAccessProfilePermissions({ processos: true, acesso_total: true }),
    (error) => error instanceof AccessProfilePermissionsError
      && error.message === 'Permissões desconhecidas: acesso_total.',
  );
});

test('rejeita valores de permissão que não sejam booleanos', () => {
  assert.throws(
    () => parseAccessProfilePermissions({ funcionarios: 'sim' }),
    (error) => error instanceof AccessProfilePermissionsError
      && error.message === 'Permissões com valor inválido: funcionarios.',
  );
});
