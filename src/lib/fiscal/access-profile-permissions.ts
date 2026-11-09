export const ACCESS_PROFILE_PERMISSION_IDS = [
  'relacionamento',
  'processos',
  'societario',
  'docs_flow',
  'funcionarios',
  'irpf',
  'financeiro',
  'equipe',
  'configuracoes',
  'view_clients',
  'edit_clients',
  'delete_clients',
  'view_passwords',
  'manage_procurations',
  'view_tasks',
  'manage_tasks',
  'complete_tasks',
  'transfer_tasks',
  'manage_groups',
] as const;

const ALLOWED_PERMISSIONS = new Set<string>(ACCESS_PROFILE_PERMISSION_IDS);

export class AccessProfilePermissionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessProfilePermissionsError';
  }
}

export function parseAccessProfilePermissions(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AccessProfilePermissionsError('Permissões do perfil são obrigatórias.');
  }

  const entries = Object.entries(value);
  const unknown = entries
    .map(([key]) => key)
    .filter((key) => !ALLOWED_PERMISSIONS.has(key));
  if (unknown.length > 0) {
    throw new AccessProfilePermissionsError(`Permissões desconhecidas: ${unknown.join(', ')}.`);
  }

  const invalid = entries
    .filter(([, permissionValue]) => typeof permissionValue !== 'boolean')
    .map(([key]) => key);
  if (invalid.length > 0) {
    throw new AccessProfilePermissionsError(`Permissões com valor inválido: ${invalid.join(', ')}.`);
  }

  return Object.fromEntries(entries) as Record<string, boolean>;
}
