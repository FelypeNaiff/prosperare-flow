import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NFSE_PROCESSING_STATES,
  NfseDomainError,
  blockRealNfseTransmission,
  prepareInternalNfseDraft,
  type InternalNfsePreparationInput,
} from './domain';

const provider = {
  clientId: 'empresa-a',
  corporateName: 'Empresa Prestadora A',
  cnpj: '11.111.111/0001-11',
};

function validInput(): InternalNfsePreparationInput {
  return {
    clientId: 'empresa-a',
    taker: { name: 'Empresa Tomadora B', document: '22.222.222/0001-22' },
    service: { description: 'Serviços contábeis mensais' },
    amounts: { serviceAmount: 350 },
  };
}

test('mantém prestador e tomador em modelos separados', () => {
  const draft = prepareInternalNfseDraft(validInput(), provider);
  assert.equal(draft.provider.cnpj, '11111111000111');
  assert.equal(draft.taker.document, '22222222000122');
  assert.notEqual(draft.provider.cnpj, draft.taker.document);
  assert.equal(draft.environment, 'PRODUCAO_RESTRITA');
  assert.equal(draft.state, 'VALIDADO');
  assert.deepEqual(draft.officialDps, { schemaVersion: '1.01', status: 'NAO_GERADA' });
});

test('mantém os papéis separados mesmo quando os documentos coincidem', () => {
  const input = validInput();
  input.taker = { name: 'Mesmo contribuinte', document: provider.cnpj };
  const draft = prepareInternalNfseDraft(input, provider);
  assert.equal(draft.provider.cnpj, draft.taker.document);
  assert.notStrictEqual(draft.provider, draft.taker);
  assert.equal(draft.provider.corporateName, 'Empresa Prestadora A');
  assert.equal(draft.taker.name, 'Mesmo contribuinte');
});

test('rejeita ambiente de produção enviado pelo navegador', () => {
  assert.throws(
    () => prepareInternalNfseDraft({ ...validInput(), environment: 'PRODUCAO' }, provider),
    /Ambiente de produção não permitido/,
  );
});

test('rejeita empresa prestadora diferente da empresa autorizada', () => {
  assert.throws(
    () => prepareInternalNfseDraft({ ...validInput(), clientId: 'empresa-b' }, provider),
    /Empresa prestadora inconsistente/,
  );
});

test('bloqueia obrigatoriamente qualquer transmissão real', () => {
  assert.deepEqual(blockRealNfseTransmission(), {
    state: 'BLOQUEADO_TRANSMISSAO',
    status: 503,
    error: 'Emissão fiscal indisponível até a homologação da integração oficial.',
  });
});

test('define o fluxo interno sem estado EMITIDA', () => {
  assert.deepEqual(NFSE_PROCESSING_STATES, [
    'RASCUNHO',
    'VALIDADO',
    'CREDENCIAL_VALIDADA',
    'DPS_GERADA',
    'XSD_VALIDADO',
    'ASSINADO',
    'BLOQUEADO_TRANSMISSAO',
  ]);
  assert.equal(NFSE_PROCESSING_STATES.includes('EMITIDA' as never), false);
});
