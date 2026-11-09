import assert from 'node:assert/strict';
import test from 'node:test';

import { chunkAuthorizedCompanyIds, mergeAuthorizedCompanyResults } from './company-query';

test('divide mais de 30 empresas sem repetir IDs', () => {
  const ids = Array.from({ length: 65 }, (_, index) => `empresa-${String(index).padStart(2, '0')}`);
  const chunks = chunkAuthorizedCompanyIds([...ids, ids[0], '']);
  assert.deepEqual(chunks.map((chunk) => chunk.length), [30, 30, 5]);
  assert.equal(new Set(chunks.flat()).size, 65);
});

test('combina lotes com deduplicação, filtro, ordenação e paginação globais', () => {
  const batches = [
    [{ id: 'c', companyId: 'empresa-31', score: 2 }, { id: 'a', companyId: 'empresa-01', score: 3 }],
    [{ id: 'b', companyId: 'empresa-32', score: 1 }, { id: 'a', companyId: 'empresa-01', score: 3 }],
  ];
  const page = mergeAuthorizedCompanyResults(batches, {
    filter: (item) => item.companyId !== 'empresa-31',
    compare: (left, right) => left.score - right.score,
    offset: 0,
    limit: 2,
  });
  assert.deepEqual(page.map((item) => item.id), ['b', 'a']);
});

test('não introduz documentos fora dos lotes autorizados', () => {
  const result = mergeAuthorizedCompanyResults([[{ id: 'permitido', companyId: 'empresa-01' }]]);
  assert.deepEqual(result, [{ id: 'permitido', companyId: 'empresa-01' }]);
});
