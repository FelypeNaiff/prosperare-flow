export type MigrationResolution =
  | { status: 'resolved'; clientId: string; source: string }
  | { status: 'ambiguous' | 'unresolved'; candidates: string[]; reason: string };

type Data = Record<string, unknown>;

export function normalizeCnpj(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function stringValues(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function resolveCompany(
  data: Data,
  clientIds: Set<string>,
  clientsByCnpj: Map<string, string[]>,
): MigrationResolution {
  const direct = [data.canonicalClientId, data.clientId, data.clienteId, data.empresaId]
    .filter((value): value is string => typeof value === 'string' && clientIds.has(value));
  const uniqueDirect = [...new Set(direct)];
  if (uniqueDirect.length === 1) return { status: 'resolved', clientId: uniqueDirect[0], source: 'client-id' };
  if (uniqueDirect.length > 1) return { status: 'ambiguous', candidates: uniqueDirect, reason: 'conflicting-client-ids' };

  const cnpjs = [data.cnpj, data.clientCnpj, data.companyCnpj, data.cnpjEmpresa]
    .map(normalizeCnpj).filter(Boolean);
  const matches = [...new Set(cnpjs.flatMap((cnpj) => clientsByCnpj.get(cnpj) || []))];
  if (matches.length === 1) return { status: 'resolved', clientId: matches[0], source: 'unique-cnpj' };
  if (matches.length > 1) return { status: 'ambiguous', candidates: matches, reason: 'duplicate-cnpj' };
  return { status: 'unresolved', candidates: [], reason: 'no-trusted-company-identifier' };
}

export function userCompanyCandidates(
  data: Data,
  clientIds: Set<string>,
  clientsByCnpj: Map<string, string[]>,
): MigrationResolution[] {
  const embedded = Array.isArray(data.empresasVinculadas) ? data.empresasVinculadas : [];
  const directIds = [...stringValues(data.clientIds), ...stringValues(data.companyIds)];
  const values: Data[] = [
    ...directIds.map((clientId) => ({ clientId })),
    ...(typeof data.clientId === 'string' ? [{ clientId: data.clientId }] : []),
    ...(typeof data.cnpj === 'string' ? [{ cnpj: data.cnpj }] : []),
    ...embedded.filter((item): item is Data => item != null && typeof item === 'object' && !Array.isArray(item)),
  ];
  return values.map((value) => resolveCompany(value, clientIds, clientsByCnpj));
}

export function assertMigrationWriteAllowed(apply: boolean, allowApply: boolean) {
  if (apply && !allowApply) {
    throw new Error('Aplicação bloqueada. Exige --apply e SPRINT_2_2_ALLOW_APPLY=true explicitamente.');
  }
}
