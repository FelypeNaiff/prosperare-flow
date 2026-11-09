# Sprint 2.3 — compatibilidade e preparação para homologação

## Alterações concluídas

- O hook multiempresa divide vínculos em lotes de até 30 IDs e combina os snapshots com deduplicação, ordenação e paginação globais testáveis.
- IRPF exige `canonicalClientId`, vínculo empresarial e permissão dedicada `irpf`. A interface não recebe, exibe ou persiste senha gov.br; regras negam documentos legados que ainda contenham `govPass`, inclusive para administradores.
- Aberturas societárias anteriores à criação de `clients/{clientId}` usam autorização pelo `createdBy`; somente o criador com permissão de processos ou administrador fiscal explícito pode acessá-las.
- Funcionários usam `canonicalClientId` e permissão dedicada `funcionarios`.
- Docs Flow usa empresas autorizadas e grava `canonicalClientId`; documentos sem empresa podem ser gerados localmente, mas não são persistidos.
- Criação, edição, ativação e exclusão de logins de clientes passaram para API autenticada, com Firebase token revogado, administrador fiscal explícito, vínculos determinísticos e auditoria.
- Importação de contas a receber exige `clientId` ou CNPJ único entre empresas autorizadas. Associação por nome foi removida; linhas ambíguas são rejeitadas.
- A migração permanece dry-run por padrão. Escrita exige simultaneamente `--apply` e `SPRINT_2_2_ALLOW_APPLY=true`; a resolução foi testada somente com dados sintéticos.

## Índices preparados (não publicados)

Arquivo: `firestore.indexes.json`.

| Coleção | Campos | Consumidor |
| --- | --- | --- |
| `generated_documents` | `canonicalClientId ASC`, `type ASC`, `createdAt DESC` | Histórico de faturamento do Docs Flow |
| `notifications` | `userId ASC`, `createdAt DESC` | Central de notificações |
| `tasks` | `clientId ASC`, `createdAt DESC` | Histórico do cliente |
| `processes` | `clienteId ASC`, `nomeProcesso ASC`, `situacao ASC` | Renovação de alvarás |

Os índices foram apenas adicionados à configuração local; não houve publicação.

## Testes

- Autorização de backend e perfis de acesso: 11/11.
- Funções multiempresa e migração sintética: 6/6.
- Firestore Emulator: 12/12.
- Total de segurança: 29/29.
- TypeScript: aprovado.
- Build Next.js: aprovado (79 páginas geradas).

## Correção bloqueante pré-commit

- A allowlist da API administrativa foi alinhada à interface e agora preserva
  explicitamente as permissões `funcionarios` e `irpf`.
- Permissões desconhecidas ou com valores que não sejam booleanos retornam erro
  de validação; não são mais removidas silenciosamente durante o salvamento.
- A alteração de perfis continua condicionada a token Firebase válido e ao
  privilégio de administrador fiscal verificado no servidor. As regras Firestore
  continuam bloqueando escrita direta em `accessProfiles`.
- Testes automatizados cobrem a preservação das duas permissões e a rejeição de
  identificadores e valores inválidos.
- Certificados e chaves privadas com extensões `.pfx`, `.p12` e `.key` passaram
  a ser ignorados pelo Git, além do padrão `.pem` já existente.

As mensagens `PERMISSION_DENIED` são esperadas nos casos negativos. O `SIGINT` é emitido pelo encerramento automático do Emulator.

## Vulnerabilidades npm (triagem, sem correção automática)

`npm audit`: 135 avisos (7 baixos, 80 moderados, 42 altos, 6 críticos). `npm audit --omit=dev`: 115 avisos (7 baixos, 75 moderados, 28 altos, 5 críticos).

- Produção: `fast-xml-parser`, `handlebars`, `next`, `proxy-addr` e `websocket-driver` aparecem como críticos, em sua maioria transitivos. O `next` possui atualização não-major indicada para 15.5.29.
- Desenvolvimento: `tar` é o crítico adicional, vindo do tooling `firebase-tools`; a correção sugerida sobe `firebase-tools` para uma versão major.
- Não foi executado `npm audit fix` nem alteração de dependências. As atualizações devem ocorrer em branch própria, com testes de regressão, especialmente Next/PWA, Firebase Admin, Genkit e XLSX.

## Pendências e homologação manual

- Registros legados sem identificador empresarial confiável continuam invisíveis para usuários não administrativos e devem constar no relatório do dry-run.
- Documentos IRPF legados com `govPass` ficam inacessíveis até saneamento por rotina administrativa offline, auditada e específica; não foi executada remoção de dados reais.
- Consultas antigas em telas de detalhe ainda usam variantes `clientId`/`clienteId` (`certidões`, `alvarás`, `installments`, histórico de tarefas e processos). Elas são limitadas pelo documento/página da empresa, mas precisam ser normalizadas para `canonicalClientId` após a migração.
- Homologar manualmente login de cliente, redefinição de senha, criação/edição/desativação pela API, IRPF, abertura societária e importação CSV com CNPJ duplicado.
- Validar os índices em projeto isolado antes de qualquer publicação.
- Executar o dry-run somente contra ambiente isolado ou export sintético. Não usar `--apply` em produção nesta fase.
- A emissão NFS-e permanece bloqueada em HTTP 503 e não chama transmissor fiscal.

## Parecer

- Commit de desenvolvimento: apto após a correção bloqueante e aprovação das verificações automatizadas; a relação final de arquivos ainda deve ser revisada antes do staging.
- Deploy/produção: **NÃO APTO** enquanto migração, índices, dependências críticas e homologação manual estiverem pendentes.
