import type {
  FiscalOperation,
  FiscalPermissions,
  FiscalUser,
  UserCompanyAccess,
} from './types';

const ADMIN_PROFILES = new Set(['ADMINISTRADOR', 'SÓCIO', 'SOCIO']);

export class FiscalAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 401 | 403 | 404 = 403,
  ) {
    super(message);
    this.name = 'FiscalAuthorizationError';
  }
}

export function normalizeProfile(user: FiscalUser): string {
  return String(user.profile || user.role || '').trim().toUpperCase();
}

export function isVerifiedAdministrator(user: FiscalUser): boolean {
  return user.status === 'ATIVO'
    && user.fiscalAdmin === true
    && ADMIN_PROFILES.has(normalizeProfile(user));
}

export function fullFiscalPermissions(): FiscalPermissions {
  return {
    consultar: true,
    emitir: true,
    cancelar: true,
    administrarCredenciais: true,
  };
}

export function authorizeFiscalOperation(
  user: FiscalUser | null,
  access: UserCompanyAccess | null,
  operation: FiscalOperation,
): void {
  if (!user) throw new FiscalAuthorizationError('Usuário não autenticado.', 401);
  if (user.status !== 'ATIVO') {
    throw new FiscalAuthorizationError('Usuário inativo.', 403);
  }
  if (isVerifiedAdministrator(user)) return;
  if (!access || access.userId !== user.id || access.status !== 'ATIVO') {
    throw new FiscalAuthorizationError('Empresa não atribuída ao usuário.', 403);
  }
  if (access.id !== `${user.id}_${access.clientId}`) {
    throw new FiscalAuthorizationError('Vínculo empresarial inconsistente.', 403);
  }
  if (!access.fiscalPermissions?.[operation]) {
    throw new FiscalAuthorizationError('Operação fiscal não autorizada.', 403);
  }
}

export function authorizeInternalNfseOperation(
  user: FiscalUser | null,
  access: UserCompanyAccess | null,
  clientId: string,
): void {
  if (!user) throw new FiscalAuthorizationError('Usuário não autenticado.', 401);
  if (user.status !== 'ATIVO') throw new FiscalAuthorizationError('Usuário inativo.', 403);
  if (isVerifiedAdministrator(user)) return;
  if (normalizeProfile(user) === 'CLIENTE') {
    throw new FiscalAuthorizationError('Emissão interna restrita à equipe Prosperare.', 403);
  }
  if (!access || access.kind !== 'FUNCIONARIO' || access.userId !== user.id || access.status !== 'ATIVO') {
    throw new FiscalAuthorizationError('Empresa não atribuída ao funcionário.', 403);
  }
  if (access.clientId !== clientId) {
    throw new FiscalAuthorizationError('Acesso cruzado entre empresas não permitido.', 403);
  }
  if (access.id !== `${user.id}_${access.clientId}`) {
    throw new FiscalAuthorizationError('Vínculo empresarial inconsistente.', 403);
  }
  if (!access.fiscalPermissions?.emitir) {
    throw new FiscalAuthorizationError('Emissão fiscal não autorizada.', 403);
  }
}
