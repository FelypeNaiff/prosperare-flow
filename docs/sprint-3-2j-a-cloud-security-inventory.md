# Sprint 3.2J-A — inventário complementar de segurança e infraestrutura Google Cloud

## Resumo executivo

Diagnóstico exclusivamente de leitura realizado em 10 de novembro de 2026, na
branch `feature/nfse-multiempresa-fase1`, referência `6d691f0`, com árvore
inicialmente limpa. Nenhum recurso, API, IAM, dado ou configuração foi alterado.

As evidências Firebase da Sprint 3.2I foram reconfirmadas com a Firebase CLI
14.22.0 e sessão preexistente: projeto `studio-4435305402-8a684`, App Hosting
`prosperare-flow-oficial` em `us-central1`, service account associada, referência
ao Cloud Run gerenciado, três bancos Firestore e metadado do identificador não
fiscal `GEMINI_API_KEY`. Nenhum payload de segredo ou documento Firestore foi
acessado.

O inventário Google Cloud complementar ficou limitado: `gcloud` não está no PATH
nem nos caminhos usuais de instalação. O Console disponível apresentou tela de
login e não havia outra sessão de navegador. Não foi iniciado login, solicitada
credencial ou instalada ferramenta. Assim, IAM, configuração detalhada do Cloud
Run, Storage, KMS, Audit Logs, Monitoring, billing e budgets permanecem **NÃO
VERIFICADOS**. Isso não comprova ausência ou inadequação desses recursos.

## Escopo e classificação

- **CONFIRMADO REMOTAMENTE:** resposta de comando de leitura na sessão existente;
- **CONFIRMADO NO REPOSITÓRIO:** arquivo versionado, sem provar estado implantado;
- **HISTÓRICO — A CONFIRMAR:** evidência de Sprint anterior não reproduzida agora;
- **NÃO VERIFICADO:** ferramenta, sessão ou permissão não permitiu confirmação.

Consultas executadas: estado Git; presença do `gcloud`; Firebase `projects:list`,
`apphosting:backends:get`, `firestore:databases:list`, agenda de backup do banco
padrão e `apphosting:secrets:describe` somente para metadados. Houve uma navegação
ao Console Cloud Run, interrompida na tela de login. Nenhuma ação de escrita foi
executada.

## Matriz de recursos e configurações

| Domínio | Estado confirmado | Não verificado | Evidência/limite |
| --- | --- | --- | --- |
| Projeto | **CONFIRMADO REMOTAMENTE:** ID `studio-4435305402-8a684`, nº `74851282547`, ativo | organização, folder e policy constraints | Firebase `projects:list` |
| App Hosting | **CONFIRMADO REMOTAMENTE:** backend `prosperare-flow-oficial`, `us-central1`, `reconciling=false`, acesso global | branch, rollouts, commit, builds, recursos efetivos | Firebase backend; acesso global não prova Cloud Run público |
| Repositório | **CONFIRMADO REMOTAMENTE:** vínculo `FelypeNaiff/prosperare-flow`, raiz `/` | governança da conexão | metadado App Hosting |
| Cloud Run gerenciado | **CONFIRMADO REMOTAMENTE:** referência ao serviço homônimo em `us-central1` | ingress, IAM, exposição pública, auth, imagem/runtime, CPU, RAM, concorrência, min/max, timeout, revisão e tráfego | App Hosting só retorna referência gerenciada |
| Cloud Run fiscal | nenhum serviço fiscal foi confirmado | existência/listagem completa | sem `gcloud`; não inferir inexistência |
| SA App Hosting | **CONFIRMADO REMOTAMENTE:** `firebase-app-hosting-compute@studio-4435305402-8a684.iam.gserviceaccount.com` associada | papéis, bindings, keys metadata | backend App Hosting |
| Outras SAs/IAM | nenhuma outra identidade foi confirmada | lista de SAs, chaves, políticas e papéis amplos | sem `gcloud`/Console autenticado |
| Storage | nenhuma evidência nova | buckets, região, PAP, UBLA, retenção, versionamento, CMEK e IAM | objetos não foram listados nem acessados |
| KMS | nenhuma evidência nova | estado da API, key rings, chaves, rotação e IAM | não ativar API; sem ferramenta disponível |
| Secret Manager | **CONFIRMADO REMOTAMENTE PARCIAL:** identificador `GEMINI_API_KEY`, versão 1 habilitada | inventário completo, replicação efetiva e IAM | payload não acessado; segredo não fiscal |
| Firestore padrão | **CONFIRMADO REMOTAMENTE:** Native Standard, `us-central1`, pessimista, free tier, retenção de versão 3600 s | finalidade fiscal, TTL fields e IAM | nenhum documento lido |
| Bancos AI Studio | **CONFIRMADO REMOTAMENTE:** dois Native Enterprise, otimistas, um `us-central1` e outro `us-west1`, sem free tier | finalidade, responsáveis, uso e custo | nomes abreviados no relatório; dados não lidos |
| PITR/proteção | **CONFIRMADO REMOTAMENTE:** PITR e delete protection desabilitados nos três bancos | outras estratégias de backup | metadado dos bancos |
| Backup | **CONFIRMADO REMOTAMENTE:** sem agenda no banco padrão | agendas nos dois bancos nomeados e backups avulsos | consulta restrita ao banco padrão |
| TTL | princípio confirmado no desenho: TTL só limpa | políticas implantadas | **NÃO VERIFICADO**; TTL não substitui expiração/atomicidade |
| Audit Logs | nenhuma evidência nova | Admin Activity, Data Access, exclusões e retenção | logs/payloads não abertos |
| Monitoring | nenhuma evidência nova | métricas, SLOs e alertas | sem Console autenticado/`gcloud` |
| Billing | histórico dizia vínculo e budgets | conta, vínculo, budgets, alertas e custos reais | **NÃO VERIFICADO**; nenhuma alteração financeira |

## Cloud Run e exposição

A existência do Cloud Run `prosperare-flow-oficial` em `us-central1` é confirmada
somente porque o App Hosting o declara como recurso gerenciado. Não foi possível
confirmar `allUsers`, `allAuthenticatedUsers`, `run.invoker`, ingress ou exigência
de autenticação. `servingLocality: GLOBAL_ACCESS` pertence ao backend App Hosting
e não deve ser interpretado como policy IAM do Cloud Run.

O `apphosting.yaml` declara `maxInstances: 1` e timeout de 300 segundos, mas CPU,
memória, concorrência e configuração efetiva implantada permanecem desconhecidas.
Não foi encontrado inventário completo suficiente para classificar um serviço
fiscal como ausente: seu estado é **NÃO VERIFICADO**.

## IAM atual e recomendado

| Identidade | Situação atual | Recomendação futura | Criticidade da lacuna |
| --- | --- | --- | --- |
| SA App Hosting confirmada | associação confirmada; roles/keys não verificados | auditar policy e manter só permissões necessárias ao backend | alta |
| Backend web → fiscal | serviço/binding não verificados | `roles/run.invoker` apenas no Cloud Run fiscal | crítica antes de homologar |
| SA fiscal | não confirmada | exclusiva, sem chave JSON, sem papéis básicos | crítica |
| SA fiscal → Firestore | não verificado | papel customizado mínimo no datastore fiscal | alta |
| SA fiscal → Storage | não verificado | leitura do objeto autorizado; sem listar buckets | crítica |
| SA fiscal → KMS | não verificado | somente `cryptoKeyVersions.useToDecrypt` na KEK | crítica |
| SA fiscal → segredos | não verificado | acesso por segredo/versão inevitável | alta |
| Pipeline | não verificado | deploy e `actAs` restritos; sem decrypt/dados fiscais | alta |
| Auditor | não verificado | view de logs segregada; sem invocar/decrypt | média |

Cloud Run fiscal deverá negar acesso público e validar OIDC com issuer, audience,
subject e expiração. Nenhum binding foi criado ou alterado nesta Sprint.

## Riscos por criticidade

### Críticos

- exposição e policy IAM do Cloud Run atual não verificadas;
- IAM/KMS/Storage do futuro cofre não verificados;
- ausência de identidade fiscal exclusiva confirmada;
- upload, chave privada e emissão não podem avançar sem esses controles.

### Altos

- três bancos sem PITR/delete protection; banco padrão sem agenda de backup;
- finalidade/custo dos bancos Enterprise não classificados;
- Data Access Audit Logs e retenção não verificados;
- divergência possível entre `apphosting.yaml` e revisão Cloud Run efetiva;
- dispersão `us-central1`/`us-west1` sem decisão arquitetural registrada.

### Médios

- branch/rollouts/commit implantado e falhas de build não verificados;
- budgets, alertas financeiros e consumo real não verificados;
- TTL policies e agendas dos bancos nomeados não verificadas;
- inventário completo de segredos não confirmado.

## Configurações recomendadas — não autorizadas

1. manter App Hosting existente em `us-central1`; não migrar nesta etapa;
2. completar export read-only de Cloud Run e IAM antes de qualquer configuração;
3. projetos separados para desenvolvimento, homologação e produção;
4. Cloud Run fiscal privado, OIDC e SA exclusiva sem chaves;
5. Firestore transacional para grants/nonces, com expiração lógica, consumo
   atômico e TTL somente como limpeza;
6. Storage por ambiente com PAP, UBLA, versionamento/lifecycle e sem URL assinada;
7. envelope AES-256-GCM, DEK por versão e KEK KMS; KMS protege armazenamento,
   mas não substitui a chave privada ICP-Brasil contida no A1;
8. Secret Manager apenas para segredos operacionais inevitáveis;
9. Data Access, redaction, retenção, alertas, budgets e DR antes de homologação;
10. `southamerica-east1` como preferência inicial fiscal, condicionada a decisão
    de residência, disponibilidade, latência e custo inter-região.

## Impacto financeiro estimado

Custos reais e billing estão **NÃO VERIFICADOS**. As faixas abaixo são cenários,
não valores garantidos, orçamento aprovado ou autorização de gasto.

| Componente | Tipo de custo | Observação |
| --- | --- | --- |
| Cloud Run atual/fiscal | CPU, memória, requests; piso com min instances | recursos efetivos atuais desconhecidos |
| Firestore | reads/writes/storage/TTL/PITR/backup/egress | bancos Enterprise nomeados não usam free tier padrão |
| Storage | GiB-mês, operações, versões, retenção e egress | ciphertext é pequeno; versões e DR acumulam |
| KMS | versões ativas e operações | HSM elevaria custo significativamente |
| Secret Manager | versões e acessos | não usar segredo por A1 sem decisão explícita |
| Audit/Logging | ingestão e retenção | Data Access pode elevar volume |
| Inter-região | transferência e latência operacional | `us-central1` ↔ `southamerica-east1`; banco em `us-west1` precisa classificação |

Cenário anterior mantido apenas para planejamento: 10 empresas US$ 0–2/mês,
50 US$ 1–8/mês, 200 US$ 5–25/mês; uma instância 1 vCPU/1 GiB sempre aquecida
pode acrescentar cerca de US$ 55–75/mês por ambiente. Exclui impostos, câmbio,
consumo atual, bancos existentes, egress, backups amplos e terceiros. Recalcular
após inventário de billing e teste de carga.

## Dependências e decisões humanas

- fornecer ambiente com `gcloud` já instalado e sessão read-only autorizada, ou
  exportações do Console aprovadas; não iniciar login novo nesta Sprint;
- aprovar projeto(s), região, proprietários, RPO/RTO e segregação ambiental;
- classificar os bancos `ai-studio-*`, seus responsáveis e custos;
- decidir Firestore dedicado/compartilhado para o fiscal;
- decidir KMS software/HSM, custódia, rotação e destruição;
- aprovar retenção, legal hold, backups e resposta a incidentes;
- definir SLO, concorrência, escala, orçamento e limites;
- aprovar bibliotecas PKCS#12/XMLDSIG, provedores e base legal/LGPD.

## Próximas ações da Sprint 3.2J-B

3.2J-B não deve ser iniciada automaticamente. Após aprovação deste relatório:

1. obter export somente leitura de `run services describe`, revisões, tráfego,
   ingress e IAM policy;
2. listar SAs, apenas metadados de chaves e policy IAM do projeto;
3. listar buckets e políticas sem objetos; verificar KMS sem ativar API;
4. listar somente metadados/ACLs de segredos, nunca payloads;
5. exportar audit config, log buckets/sinks, alertas, billing e budgets;
6. revisar as evidências e emitir ADR de região/ambientes;
7. somente depois avaliar IaC em modo plan, sem apply.

## Parecer

Não há evidência suficiente para configurar recurso real com segurança. A
primeira ação futura continua sendo completar o inventário read-only de Cloud Run
e IAM. A primeira criação possível, em Sprint posterior e com autorização nova,
continua sendo uma SA fiscal sem chaves e inicialmente sem permissões de dados.

HTTP 503, kill switch e aplicação atual permanecem preservados. Nenhum A1 real,
upload, assinatura, emissão ou transmissão NFS-e foi utilizado ou habilitado.
