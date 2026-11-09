export const NFSE_ENVIRONMENTS = ['PRODUCAO_RESTRITA', 'PRODUCAO'] as const;
export type NfseEnvironment = (typeof NFSE_ENVIRONMENTS)[number];

export const NFSE_PROCESSING_STATES = [
  'RASCUNHO',
  'VALIDADO',
  'CREDENCIAL_VALIDADA',
  'DPS_GERADA',
  'XSD_VALIDADO',
  'ASSINADO',
  'BLOQUEADO_TRANSMISSAO',
] as const;
export type NfseProcessingState = (typeof NFSE_PROCESSING_STATES)[number];

export const NFSE_DEVELOPMENT_ENVIRONMENT = 'PRODUCAO_RESTRITA' as const satisfies NfseEnvironment;

export interface NfseProvider {
  clientId: string;
  corporateName: string;
  cnpj: string;
}

export interface NfseTaker {
  name: string;
  document: string;
}

export interface NfseService {
  description: string;
}

export interface NfseAmounts {
  serviceAmount: number;
}

export interface InternalNfsePreparationInput {
  clientId?: unknown;
  environment?: unknown;
  taker?: {
    name?: unknown;
    document?: unknown;
  };
  service?: {
    description?: unknown;
  };
  amounts?: {
    serviceAmount?: unknown;
  };
}

export interface InternalNfseDraft {
  environment: typeof NFSE_DEVELOPMENT_ENVIRONMENT;
  state: 'VALIDADO';
  provider: NfseProvider;
  taker: NfseTaker;
  service: NfseService;
  amounts: NfseAmounts;
  officialDps: {
    schemaVersion: '1.01';
    status: 'NAO_GERADA';
  };
}

export class NfseDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NfseDomainError';
  }
}

function normalizeDocument(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function requiredText(value: unknown, field: string, minimum: number, maximum: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < minimum || text.length > maximum) {
    throw new NfseDomainError(`${field} inválido.`);
  }
  return text;
}

export function prepareInternalNfseDraft(
  input: InternalNfsePreparationInput,
  provider: NfseProvider,
): InternalNfseDraft {
  if (input.environment !== undefined && input.environment !== NFSE_DEVELOPMENT_ENVIRONMENT) {
    throw new NfseDomainError('Ambiente de produção não permitido nesta fase.');
  }
  if (input.clientId !== provider.clientId) {
    throw new NfseDomainError('Empresa prestadora inconsistente.');
  }

  const providerDocument = normalizeDocument(provider.cnpj);
  if (providerDocument.length !== 14) {
    throw new NfseDomainError('CNPJ do prestador inválido.');
  }
  const takerDocument = normalizeDocument(input.taker?.document);
  if (![11, 14].includes(takerDocument.length)) {
    throw new NfseDomainError('CPF/CNPJ do tomador inválido.');
  }
  const amount = typeof input.amounts?.serviceAmount === 'number'
    ? input.amounts.serviceAmount
    : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new NfseDomainError('Valor do serviço inválido.');
  }

  return {
    environment: NFSE_DEVELOPMENT_ENVIRONMENT,
    state: 'VALIDADO',
    provider: {
      clientId: provider.clientId,
      corporateName: requiredText(provider.corporateName, 'Razão social do prestador', 2, 200),
      cnpj: providerDocument,
    },
    taker: {
      name: requiredText(input.taker?.name, 'Nome do tomador', 2, 200),
      document: takerDocument,
    },
    service: {
      description: requiredText(input.service?.description, 'Descrição do serviço', 5, 2_000),
    },
    amounts: { serviceAmount: amount },
    officialDps: {
      schemaVersion: '1.01',
      status: 'NAO_GERADA',
    },
  };
}

export interface BlockedNfseTransmission {
  state: 'BLOQUEADO_TRANSMISSAO';
  status: 503;
  error: string;
}

export function blockRealNfseTransmission(): BlockedNfseTransmission {
  return {
    state: 'BLOQUEADO_TRANSMISSAO',
    status: 503,
    error: 'Emissão fiscal indisponível até a homologação da integração oficial.',
  };
}
