# Sprint 2.2 — inventário multiempresa

## Estratégia aplicada

- `useAuthorizedCompanyCollection` obtém as empresas acessíveis pela API autenticada e cria consultas Firestore em lotes de no máximo 30 IDs.
- Coleções empresariais usam `where('canonicalClientId', 'in', ids)`; `clients` usa `documentId()`.
- O navegador continua sujeito às regras Firestore. A lista devolvida pela API não substitui a validação das regras.
- Documentos sem `canonicalClientId` não aparecem nas novas listagens globais até serem normalizados.

## Inventário

| Módulo | Coleções/consultas encontradas | Situação |
|---|---|---|
| Dashboard | `clients`, `processes`, `receivables`, `alvaras`, `certidoes` globais | Adaptado para todas as empresas autorizadas |
| Clientes | `clients` global; tarefas, processos e contratos por cliente | Lista adaptada; operações por cliente continuam vinculadas ao ID da rota |
| Processos | `processes` global, `clients` global, criação em lote | Lista e criação adaptadas; novos processos recebem `canonicalClientId` |
| Tarefas/atendimentos | `tasks` global, `clients` global | Agenda e atendimentos adaptados; novos tickets recebem `canonicalClientId` |
| Financeiro | `contracts`, `receivables`, `installments` globais; `payables` interno | Contratos, recebíveis, parcelamentos e calendário adaptados; `payables` permanece administrativo |
| Cofre | `clients` e `clientAccesses` globais | Adaptado por empresa; leitura ainda exige `view_passwords`; escrita permanece administrativa |
| Certidões | `certidoes` e `clients` globais; `certifications` por cliente | Listas e novas gravações adaptadas |
| Alvarás | `alvaras` e `clients` globais | Listas e novas gravações adaptadas |
| Análise fiscal | `clients` e `analisesFiscais` globais | Consulta segmentada; regra continua exigindo administrador fiscal |
| Societário — alteração | `societaryAlterations` e `clients` globais | Adaptado para permissão `processos` + vínculo |
| Societário — abertura | `societaryOpenings` sem cliente existente | Permanece administrativo; não há tenant confiável para segmentar |
| IRPF | `irpf_declarations` filtrado por responsável, sem empresa uniforme | Permanece administrativo; filtro por colaborador não prova vínculo empresarial |
| Funcionários | documentos legados identificados principalmente por CNPJ | Portal usa API autenticada; dashboard requer normalização antes de acesso direto segmentado |
| Docs Flow | `generated_documents` e seletores globais de clientes | Coleção já possui regra empresarial, mas formulários legados ainda precisam homologação/adaptação completa |
| Login de cliente | `users` e `clients`; criação via Identity Toolkit no navegador | Incompatível com a nova administração server-side; requer API dedicada antes de reativar edição completa |

## Migração preparada

O script `scripts/sprint-2-2-migration.ts`:

1. roda em `dry-run` por padrão;
2. resolve empresa apenas por ID de cliente existente ou CNPJ único;
3. relata IDs conflitantes, CNPJ duplicado e documentos sem identificador confiável;
4. prepara vínculos determinísticos `userCompanyAccess/{uid}_{clientId}`;
5. não concede permissões fiscais a funcionários durante inferência;
6. exige `--apply` e `SPRINT_2_2_ALLOW_APPLY=true` simultaneamente para escrever.

O dry-run não foi executado nesta Sprint porque isso acessaria o projeto configurado. Nenhuma migração ou leitura de dados reais foi autorizada.

## Ambiguidades previstas

- importações financeiras contendo somente nome textual da empresa;
- abertura societária anterior à criação de um cliente;
- IRPF sem `clientId`/`canonicalClientId`;
- `funcionarios` com CNPJ ausente ou duplicado;
- documentos com `clientId` e `clienteId` conflitantes;
- CNPJs duplicados em `clients`;
- usuários legados sem `cnpj`, `clientIds`, `companyIds` ou `empresasVinculadas` resolvível.

## Homologação manual pendente

- dashboard e calendários com usuário vinculado a mais de 30 empresas;
- criação/edição/exclusão em cada módulo com perfis reais;
- importação CSV de contas a receber com identificação empresarial obrigatória;
- telas de login de cliente e funcionários;
- abertura societária e IRPF;
- Docs Flow e componentes fora das rotas principais;
- índices compostos exigidos pelas consultas em produção;
- comportamento de registros legados antes e depois da migração.

## Dependências

`npm audit` encontrou 135 avisos: 7 baixos, 80 moderados, 42 altos e 6 críticos. Excluindo `devDependencies`, restam 115: 7 baixos, 75 moderados, 28 altos e 5 críticos. Portanto, o tooling adiciona 20 ocorrências ao grafo (5 moderadas, 14 altas e 1 crítica), principalmente pela cadeia de `firebase-tools`; o item crítico inclui `tar`. Nenhuma atualização automática foi aplicada porque as correções sugeridas incluem upgrades major e precisam de validação isolada.
