export const FISCAL_OPERATIONS = [
  'consultar',
  'emitir',
  'cancelar',
  'administrarCredenciais',
] as const;

export type FiscalOperation = (typeof FISCAL_OPERATIONS)[number];

export type FiscalPermissions = Record<FiscalOperation, boolean>;

export interface FiscalUser {
  id: string;
  email?: string | null;
  profile?: string;
  role?: string;
  status?: string;
  fiscalAdmin?: boolean;
  cnpj?: string;
  empresasVinculadas?: Array<{ cnpj?: string }>;
}

export interface UserCompanyAccess {
  id: string;
  userId: string;
  clientId: string;
  kind: 'CLIENTE' | 'FUNCIONARIO';
  status: 'ATIVO' | 'INATIVO';
  fiscalPermissions: FiscalPermissions;
}

export interface AccessibleCompany {
  id: string;
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  fiscalPermissions: FiscalPermissions;
}
