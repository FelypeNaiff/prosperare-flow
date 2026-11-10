# Sprint 3.2I — inventário remoto somente leitura da infraestrutura fiscal

## Resumo executivo

Inventário realizado em 10 de novembro de 2026, exclusivamente por consultas de
leitura com a Firebase CLI 14.22.0 já instalada no projeto e uma sessão
preexistente. Não houve login, troca de projeto padrão, impersonação, instalação,
ativação de API, acesso a payload de segredo, leitura de documentos Firestore ou
qualquer operação de escrita.

O projeto histórico foi **CONFIRMADO REMOTAMENTE**: Firebase project ID
`studio-4435305402-8a684`, project number `74851282547`, display name
`PROSPERARE Flow`, estado `ACTIVE`. A conta preexistente usada na consulta é
registrada neste relatório de forma mascarada como `f***@gmail.com`.

O backend App Hosting `prosperare-flow-oficial` foi confirmado em
`us-central1`, associado ao repositório `FelypeNaiff/prosperare-flow`, raiz `/`,
à service account `firebase-app-hosting-compute@studio-4435305402-8a684.iam.gserviceaccount.com`
e ao serviço Cloud Run gerenciado homônimo. A branch de publicação, rollouts,
commit implantado e configuração detalhada do Cloud Run não foram expostos pela
CLI disponível e permanecem **NÃO VERIFICADOS**.

Foram confirmados três bancos Firestore. O banco `(default)` é Standard/Native,
em `us-central1`, com concorrência pessimista, PITR e delete protection
desabilitados e sem agenda de backup. Dois bancos `ai-studio-*` também existem,
um em `us-central1` e outro em `us-west1`. Nenhum documento foi consultado.

Não há `gcloud` instalado. IAM, inventário completo do Cloud Run, Storage, KMS,
Audit Logs, Monitoring, billing e budgets ficaram **NÃO VERIFICADOS**. Ausência
de evidência não foi tratada como inexistência.

## Escopo e método

### Verificação local

- branch `feature/nfse-multiempresa-fase1`;
- HEAD `1a990b870cfb05c02b389212051610394554d028`;
- working tree inicialmente limpa;
- `apphosting.yaml` declara `maxInstances: 1`, `timeoutSeconds: 300` e referência
  ao identificador `GEMINI_API_KEY`;
- `studio.json`, `scripts/firebase-config.json` e `src/firebase/config.ts`
  apontam para `studio-4435305402-8a684`;
- planos 3.2G/3.2H e checklist revisados antes das consultas.

### Consultas remotas executadas

- sessão já existente: `firebase login:list`;
- projetos acessíveis: `firebase projects:list --json`;
- App Hosting: `apphosting:backends:list` e `backends:get`;
- Firestore: `databases:list`, `firestore:indexes` e agenda de backup do banco
  padrão;
- Secret Manager via App Hosting: somente `secrets:describe GEMINI_API_KEY`.

Não foram usados comandos `create`, `set`, `update`, `delete`, `deploy`, `use`,
`auth`, `access` ou `grantaccess`. A listagem de projetos foi usada apenas para
confirmar acesso ao alvo; os demais projetos não são reproduzidos neste relatório.

## Matriz de infraestrutura verificada

| Recurso | Estado anterior (3.2H) | Estado remoto | Evidência | Divergência/risco | Ação futura e aprovação |
| --- | --- | --- | --- | --- | --- |
| Projeto Firebase/GCP | histórico a confirmar | **CONFIRMADO REMOTAMENTE:** `studio-4435305402-8a684`, nº `74851282547`, ativo | `projects:list` | nenhuma na identificação | manter inventário datado; aprovação do dono do projeto |
| App Hosting | histórico: `us-central1`, backend conhecido | **CONFIRMADO REMOTAMENTE:** `prosperare-flow-oficial`, `us-central1`, estado não reconciliando | `backends:list/get` | região histórica confirmada | preservar backend; não migrar nesta etapa |
| Repositório conectado | não verificado | **CONFIRMADO REMOTAMENTE:** link `FelypeNaiff/prosperare-flow`, raiz `/` | backend `codebase` | proprietário/conexão exigem governança | validar responsáveis antes de alterar pipeline |
| Branch/auto rollout | histórico: `main` | **NÃO VERIFICADO** | CLI não retornou branch/rollouts | deploy de branch indevida não pode ser descartado | Console/API read-only autorizada; aprovação de plataforma |
| Último rollout/commit/builds | não verificado | **NÃO VERIFICADO** | comando de listagem não disponível na CLI | rastreabilidade incompleta | capturar histórico no Console sem iniciar rollout |
| Configuração declarativa | repositório: max 1, timeout 300 s | **CONFIRMADO NO REPOSITÓRIO**, não remotamente | `apphosting.yaml` | possível divergência com revisão efetiva | comparar com Cloud Run quando houver ferramenta autorizada |
| Variável/segredo | referência não fiscal conhecida | **CONFIRMADO REMOTAMENTE:** metadado `GEMINI_API_KEY`, versão 1 habilitada; payload não acessado | `secrets:describe` | IAM/replicação efetiva não detalhados | revisar metadados/IAM; nunca registrar payload |
| SA App Hosting | histórico a confirmar | **CONFIRMADO REMOTAMENTE:** `firebase-app-hosting-compute@...` associada ao backend | backend `serviceAccount` | papéis atuais não verificados | export IAM read-only antes de propor binding |
| Cloud Run gerenciado | histórico a confirmar | **CONFIRMADO REMOTAMENTE:** referência `projects/74851282547/locations/us-central1/services/prosperare-flow-oficial` | backend `managedResources` | CPU, RAM, concorrência, escala, timeout, ingress, IAM, revisão e tráfego não verificados | inventário `gcloud run services/revisions describe` após ferramenta aprovada |
| Serviço fiscal independente | não verificado | **NÃO VERIFICADO** | não foi possível listar todos os serviços Cloud Run | não inferir inexistência | listagem regional read-only futura |
| Service accounts/IAM | não verificado | **NÃO VERIFICADO**, exceto associação da SA do App Hosting | sem `gcloud` | risco de papéis básicos/públicos/excessivos | exportar SAs, keys metadata e policy; segurança/IAM admin |
| Cloud Storage | histórico: nenhum bucket fiscal identificado | **NÃO VERIFICADO** | sem ferramenta autorizada disponível | não afirmar ausência; exposição/retention desconhecidas | listar buckets e políticas sem listar objetos |
| Cloud KMS | histórico: API não ativada | **NÃO VERIFICADO** | sem ferramenta autorizada disponível | estado pode ter mudado | verificar serviços/key rings sem ativar API |
| Secret Manager | histórico: existente, sem segredo fiscal | **CONFIRMADO REMOTAMENTE PARCIAL:** somente identificador não fiscal acima | metadado App Hosting | inventário total e IAM não verificados | listar apenas metadados/IAM em consulta futura |
| Firestore `(default)` | projeto/região não verificados | **CONFIRMADO REMOTAMENTE:** Native Standard, `us-central1`, concorrência pessimista, free tier | `databases:list` | PITR/delete protection desabilitados; uso fiscal não aprovado | decidir banco fiscal, região, backup e proteção |
| Firestore `ai-studio-*` | não documentado | **CONFIRMADO REMOTAMENTE:** dois bancos Native Enterprise, `us-central1` e `us-west1` | `databases:list` | finalidade/custos e segregação precisam ser confirmados; dados não lidos | responsáveis devem classificar uso e retenção |
| PITR/delete protection | não verificado | **CONFIRMADO REMOTAMENTE:** desabilitados nos três bancos | `databases:list` | risco de recuperação/exclusão | decisão humana de RPO/RTO antes de qualquer mudança |
| Backup padrão | não verificado | **CONFIRMADO REMOTAMENTE:** nenhuma agenda no banco `(default)` | `backups:schedules:list` | recuperação depende de outras medidas não verificadas | desenhar e aprovar DR antes de configurar |
| Índices padrão | repositório contém configuração | **CONFIRMADO REMOTAMENTE:** nenhum índice composto/override retornado para `(default)` | `firestore:indexes` | verificar compatibilidade entre arquivo local e deploy futuro; nenhuma publicação feita | revisão documental antes de qualquer deploy |
| TTL Firestore | não verificado | **NÃO VERIFICADO** | CLI usada não expôs field TTL policies | TTL nunca substitui expiração lógica/atomicidade | consultar field configs read-only futuramente |
| Logging/Data Access | histórico pendente | **NÃO VERIFICADO** | sem `gcloud`; logs não foram abertos | acesso a dados pode não estar auditado | export audit config, buckets, sinks e retenção |
| Monitoring/alertas | não verificado | **NÃO VERIFICADO** | sem ferramenta autorizada | falhas/custo podem não alertar | listar métricas/policies read-only |
| Billing/budgets | histórico: vinculados/existentes | **NÃO VERIFICADO** | Firebase CLI não forneceu metadados | não presumir vínculo/cobertura atuais | consulta de billing/budgets após acesso aprovado |

## App Hosting e Cloud Run

O backend foi criado em 26/03/2026 e atualizado em 04/11/2026 segundo metadados
remotos. `reconciling: false` confirma apenas que não havia reconciliação em
andamento no instante consultado; não substitui saúde, rollout ou SLO.

`servingLocality: GLOBAL_ACCESS` é atributo do backend App Hosting e não prova
que o Cloud Run aceite invocação pública direta. Política IAM, ingress e
autenticação do serviço permanecem **NÃO VERIFICADOS**.

A referência gerenciada confirma a existência do serviço Cloud Run
`prosperare-flow-oficial` em `us-central1`, mas não confirma runtime, imagem,
CPU, memória, concorrência, instâncias, timeout, revisão ou tráfego. O
`apphosting.yaml` continua sendo evidência local, não prova da configuração
efetivamente implantada.

Branch `main`, automação de publicação, último rollout, commit implantado e
falhas de build permanecem **NÃO VERIFICADOS**. Nenhum lançamento foi iniciado.

## Matriz IAM atual e proposta

| Identidade | Recurso | Papel atual | Papel recomendado futuro | Situação |
| --- | --- | --- | --- | --- |
| SA App Hosting confirmada | backend/Cloud Run gerenciado | **NÃO VERIFICADO** | preservar apenas o necessário ao App Hosting | export IAM pendente |
| Backend web | Cloud Run fiscal | serviço fiscal não verificado; binding não verificado | `roles/run.invoker` no serviço específico | pendente de criação e aprovação |
| Serviço fiscal | Firestore fiscal | identidade e papel não confirmados | papel customizado mínimo para grants/nonces/metadados | pendente |
| Serviço fiscal | Storage fiscal | não verificado | `storage.objects.get` no bucket/escopo aprovado | pendente |
| Serviço fiscal | KMS | não verificado | somente `cloudkms.cryptoKeyVersions.useToDecrypt` na KEK | pendente |
| Serviço fiscal | Secret Manager | não verificado | `secretmanager.versions.access` por segredo inevitável | pendente |
| Pipeline | Cloud Run/Artifact Registry | não verificado | deploy/repositório e `actAs` estritamente limitados | pendente |
| Auditor | logs/views | não verificado | leitura segregada, sem invocar/decrypt/acessar objetos | pendente |

Não foram listadas chaves de service account nem alterados bindings. A futura SA
fiscal deve ser exclusiva, sem chave JSON, sem papéis básicos e sem acesso
cruzado entre ambientes. `allUsers` e `allAuthenticatedUsers` são proibidos na
fronteira fiscal.

## Firestore e controles distribuídos

O banco padrão em `us-central1` é tecnicamente capaz de transações pessimistas,
mas isso não constitui aprovação para armazenar grants, nonces ou metadados
fiscais nele. Antes de decidir, é necessário avaliar isolamento por projeto ou
banco, localização do futuro Cloud Run fiscal, IAM, custo, quotas, RPO/RTO e
blast radius do backend atual.

O desenho futuro exige transação condicional para criação/consumo único,
expiração lógica validada em cada operação, revogação consistente e falha
fechada. TTL é somente limpeza posterior e não substitui expiração nem
atomicidade. Nenhuma coleção, documento, transação ou política TTL foi criada ou
lida nesta Sprint.

PITR e delete protection desabilitados e ausência de agenda de backup no banco
padrão são riscos de recuperação, não autorização para habilitá-los nesta Sprint.

## Armazenamento, criptografia e segredos

Cloud Storage e Cloud KMS permanecem **NÃO VERIFICADOS**. O registro anterior de
“nenhum bucket fiscal identificado” e “KMS não ativado” continua histórico, não
é confirmação atual.

O único segredo confirmado por identificador é `GEMINI_API_KEY`, não fiscal. O
payload nunca foi acessado. Não foi confirmado nenhum segredo de certificado.

A arquitetura recomendada permanece: bucket privado por ambiente, PAP e UBLA,
sem URL assinada; envelope AES-256-GCM com DEK por versão; KEK KMS; metadados
separados; PFX e senha abertos apenas em memória. KMS protege a DEK e o material
em repouso, mas não substitui a chave privada ICP-Brasil contida no A1.

## Auditoria, monitoramento, DR e riscos

Audit Logs, Data Access, retenção, sinks, views, métricas, alertas, billing e
budgets não puderam ser confirmados. Não foram abertos payloads de logs.

Riscos prioritários:

1. IAM e invocação pública do Cloud Run não verificados;
2. PITR/delete protection desabilitados e sem backup agendado no banco padrão;
3. múltiplos bancos Firestore sem finalidade/custo documentados neste escopo;
4. região `us-west1` em um banco, ampliando dispersão regional;
5. branch, rollout e commit publicado sem confirmação remota;
6. ausência de inventário atual de Storage/KMS/Data Access/budgets;
7. possível divergência entre `apphosting.yaml` e Cloud Run efetivo.

DR futuro exige RPO/RTO aprovado, backup de metadados e envelopes, versões KMS
necessárias, restauração sintética e runbook. Nenhuma configuração de DR foi
alterada.

## Custos revisados e limitações

Não foi possível consultar faturamento ou consumo real. As estimativas não são
custos garantidos nem orçamento aprovado.

| Componente | Natureza | Premissa/risco de custo |
| --- | --- | --- |
| App Hosting/Cloud Run atual | variável e eventualmente mínimo configurado | configuração/consumo efetivos não verificados |
| Cloud Run fiscal futuro | variável; fixo se `minInstances > 0` | escala a zero reduz piso; região e concorrência alteram custo |
| Firestore | operações, storage, TTL, PITR/backup e egress | dois bancos nomeados Enterprise podem ter cobrança; consumo não consultado |
| Storage fiscal | GiB-mês, operações, versões, retenção e egress | tamanho do A1 é pequeno, mas versões/backup e inter-região somam |
| KMS | versão ativa e operações criptográficas | software é baixo volume; HSM altera materialmente o custo |
| Secret Manager | versões ativas e acessos | não usar um segredo por certificado sem decisão explícita |
| Logging/Audit | ingestão e retenção | Data Access aumenta volume; redaction e retenção devem ser dimensionadas |
| Inter-região | transferência e latência | App Hosting/Firestore em `us-central1` versus preferência fiscal em `southamerica-east1` |

Mantêm-se apenas como cenário preliminar da 3.2G: 10 empresas US$ 0–2/mês, 50
US$ 1–8/mês e 200 US$ 5–25/mês, mais aproximadamente US$ 55–75/mês por ambiente
se houver uma instância 1 vCPU/1 GiB sempre aquecida. Essas faixas excluem
impostos, câmbio, consumo atual desconhecido, bancos existentes, egress,
builds, backups amplos e terceiros. Devem ser refeitas após inventário de billing,
configuração regional e teste de carga.

## Decisões de arquitetura

1. manter App Hosting existente em `us-central1`; não migrar nesta etapa;
2. tratar `southamerica-east1` apenas como preferência inicial para o fiscal;
3. medir latência/custo e decidir se dados fiscais co-localizam com o serviço ou
   se a transferência inter-região é aceitável;
4. separar desenvolvimento, homologação e produção por projeto preferencialmente;
5. criar futuramente SA fiscal exclusiva, sem chaves, após IAM atual ser auditado;
6. Cloud Run fiscal privado, OIDC com audience exata e somente backend invocador;
7. datastore transacional para grant/nonce/idempotência, sem depender de TTL;
8. Storage privado e envelope encryption; KMS apenas para proteção da DEK;
9. Secret Manager somente para segredos operacionais inevitáveis;
10. Data Access, redaction, SLO, alertas, budgets e DR antes da homologação.

Nenhuma recomendação autoriza implementação.

## Decisões pendentes e próximos passos

- autorizar uma futura estação/sessão com `gcloud` já instalado e acesso somente
  leitura, sem login novo, ou fornecer exportações do Console aprovadas;
- confirmar branch/rollouts/builds do App Hosting;
- descrever Cloud Run e sua policy IAM/ingress/revisões;
- inventariar SAs, IAM e metadados de chaves, sem gerar credenciais;
- listar buckets/políticas, KMS/key rings e metadados de segredos;
- exportar audit config, log buckets/sinks, alertas, billing e budgets;
- classificar os dois bancos `ai-studio-*` e seus custos/responsáveis;
- decidir região, ambientes, RPO/RTO e datastore fiscal.

## Parecer sobre a primeira configuração futura

Ainda não é seguro configurar recurso real. O próximo passo deve continuar sendo
uma consulta complementar somente leitura dos domínios não verificados,
especialmente IAM e policy/ingress do Cloud Run. Depois de revisão humana, o
primeiro artefato configurável continua sendo IaC em modo plan, sem apply.

Somente após IAM atual, região e segregação serem aprovados, a primeira criação
cloud recomendada é uma service account fiscal exclusiva, sem chaves e sem
permissões de dados iniciais. Isso pertence à futura Sprint 3.2J e exige nova
autorização explícita.

Upload, recuperação, assinatura e emissão permanecem bloqueados com HTTP 503. O
kill switch e a aplicação atual foram preservados. Nenhum certificado A1 real ou
transmissão NFS-e foi utilizado.
