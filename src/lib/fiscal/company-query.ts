export const FIRESTORE_IN_LIMIT = 30;

export function chunkAuthorizedCompanyIds(companyIds: string[], limit = FIRESTORE_IN_LIMIT) {
  const uniqueIds = [...new Set(companyIds.filter(Boolean))].sort();
  const chunks: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += limit) {
    chunks.push(uniqueIds.slice(index, index + limit));
  }
  return chunks;
}

export type AuthorizedResultOptions<T> = {
  filter?: (item: T) => boolean;
  compare?: (left: T, right: T) => number;
  offset?: number;
  limit?: number;
};

export function mergeAuthorizedCompanyResults<T extends { id: string }>(
  batches: Iterable<ReadonlyArray<T>>,
  options: AuthorizedResultOptions<T> = {},
) {
  const unique = new Map<string, T>();
  for (const batch of batches) {
    for (const item of batch) unique.set(item.id, item);
  }

  let result = [...unique.values()];
  if (options.filter) result = result.filter(options.filter);
  result.sort(options.compare ?? ((left, right) => left.id.localeCompare(right.id)));

  const offset = Math.max(0, options.offset ?? 0);
  const end = options.limit === undefined ? undefined : offset + Math.max(0, options.limit);
  return result.slice(offset, end);
}
