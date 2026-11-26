export interface GroupProcessReference {
  readonly templateId?: unknown;
  readonly title?: unknown;
  readonly dueDay?: string;
}

export interface GroupGenerationEntity {
  readonly id: string;
}

export interface ResolvedGroupGenerationCandidate<
  TClient extends GroupGenerationEntity,
  TTemplate extends GroupGenerationEntity,
  TModelReference extends GroupProcessReference,
> {
  readonly client: TClient;
  readonly model: TTemplate;
  readonly modelRef: TModelReference;
}

export interface GroupGenerationResolution<
  TClient extends GroupGenerationEntity,
  TTemplate extends GroupGenerationEntity,
  TModelReference extends GroupProcessReference,
> {
  readonly candidates: Array<ResolvedGroupGenerationCandidate<TClient, TTemplate, TModelReference>>;
  readonly validClientCount: number;
  readonly missingClientIds: string[];
  readonly missingModelReferences: string[];
}

/**
 * Resolve referências somente contra os dados já autorizados e completamente
 * carregados pelo chamador. Referências indisponíveis nunca viram candidatos,
 * mas também não impedem a geração dos vínculos válidos restantes.
 */
export function resolveGroupGenerationReferences<
  TClient extends GroupGenerationEntity,
  TTemplate extends GroupGenerationEntity,
  TModelReference extends GroupProcessReference,
>(input: {
  readonly clientIds: readonly unknown[];
  readonly modelReferences: readonly TModelReference[];
  readonly clients: readonly TClient[];
  readonly templates: readonly TTemplate[];
}): GroupGenerationResolution<TClient, TTemplate, TModelReference> {
  const clientsById = new Map(input.clients.map((client) => [client.id, client]));
  const templatesById = new Map(input.templates.map((template) => [template.id, template]));
  const validClients: TClient[] = [];
  const missingClientIds: string[] = [];
  const seenClientIds = new Set<string>();

  for (const value of input.clientIds) {
    if (typeof value !== 'string' || value.length === 0 || seenClientIds.has(value)) continue;
    seenClientIds.add(value);
    const client = clientsById.get(value);
    if (client) validClients.push(client);
    else missingClientIds.push(value);
  }

  const resolvedModels: Array<{ model: TTemplate; modelRef: TModelReference }> = [];
  const missingModelReferences: string[] = [];
  for (const modelRef of input.modelReferences) {
    const templateId = typeof modelRef.templateId === 'string' ? modelRef.templateId : '';
    const model = templateId ? templatesById.get(templateId) : undefined;
    if (model) resolvedModels.push({ model, modelRef });
    else {
      const title = typeof modelRef.title === 'string' ? modelRef.title : '';
      missingModelReferences.push(templateId || title || 'Modelo sem identificação');
    }
  }

  return {
    candidates: validClients.flatMap((client) =>
      resolvedModels.map(({ model, modelRef }) => ({ client, model, modelRef }))),
    validClientCount: validClients.length,
    missingClientIds,
    missingModelReferences,
  };
}
