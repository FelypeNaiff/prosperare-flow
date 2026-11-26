import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveGroupGenerationReferences } from './group-process-generation';

test('gera candidatos para vínculos válidos e isola clientes indisponíveis', () => {
  const clientIds = Array.from({ length: 54 }, (_, index) => `cliente-${index + 1}`);
  const clients = clientIds.slice(0, 48).map((id) => ({ id }));
  const modelReferences = [{ templateId: 'modelo-folha', title: 'Folha mensal' }];

  const resolution = resolveGroupGenerationReferences({
    clientIds,
    clients,
    modelReferences,
    templates: [{ id: 'modelo-folha' }],
  });

  assert.equal(resolution.validClientCount, 48);
  assert.equal(resolution.candidates.length, 48);
  assert.deepEqual(resolution.missingClientIds, clientIds.slice(48));
  assert.deepEqual(resolution.missingModelReferences, []);
});

test('modelo indisponível é contado uma vez e não bloqueia outro modelo válido', () => {
  const validReference = { templateId: 'modelo-valido', title: 'Válido' };
  const missingReference = { templateId: 'modelo-removido', title: 'Removido' };
  const resolution = resolveGroupGenerationReferences({
    clientIds: ['cliente-1', 'cliente-2'],
    clients: [{ id: 'cliente-1' }, { id: 'cliente-2' }],
    modelReferences: [validReference, missingReference],
    templates: [{ id: 'modelo-valido' }],
  });

  assert.equal(resolution.candidates.length, 2);
  assert.ok(resolution.candidates.every(({ modelRef }) => modelRef === validReference));
  assert.deepEqual(resolution.missingModelReferences, ['modelo-removido']);
});

test('não duplica cliente repetido e não modifica as entradas', () => {
  const clientIds = ['cliente-1', 'cliente-1'];
  const clients = [{ id: 'cliente-1', name: 'Cliente' }];
  const modelReferences = [{ templateId: 'modelo-1', dueDay: '20' }];
  const templates = [{ id: 'modelo-1', name: 'Modelo' }];

  const resolution = resolveGroupGenerationReferences({
    clientIds,
    clients,
    modelReferences,
    templates,
  });

  assert.equal(resolution.validClientCount, 1);
  assert.equal(resolution.candidates.length, 1);
  assert.deepEqual(clientIds, ['cliente-1', 'cliente-1']);
  assert.equal(resolution.candidates[0]?.client, clients[0]);
  assert.equal(resolution.candidates[0]?.modelRef, modelReferences[0]);
});
