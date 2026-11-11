# Sprint 3.2J-B — consolidação do inventário real do Google Cloud

## Resumo executivo

Consolidação documental realizada em 11 de novembro de 2026, na branch
`feature/nfse-multiempresa-fase1`, referência `f5d74b9`, com árvore inicialmente
limpa. Nenhuma consulta remota, alteração ou configuração Google Cloud foi feita
nesta execução. Os dados novos abaixo foram observados manualmente no Console e
fornecidos para consolidação; são classificados como **VERIFICADO MANUALMENTE
NO CONSOLE — EVIDÊNCIA INFORMADA**, não como reconfirmação independente.

O projeto `studio-4435305402-8a684` mantém o App Hosting/Cloud Run gerenciado em
`us-central1`. O Cloud Run exige autenticação IAM, mas seu ingress está em
`Todos`; isso permite chegada de rede e não equivale, isoladamente, a invocação
anônima. A policy IAM efetiva e caminhos alternativos de acesso ainda precisam
de revisão específica.

Há divergência de escala: `apphosting.yaml` declara `maxInstances: 1`, enquanto
o Console exibiu máximo 20 no Cloud Run. A divergência não foi corrigida.

Foram identificadas três service accounts ativas, todas sem chaves na coluna
consultada; nenhuma identidade fiscal exclusiva foi identificada. Cloud KMS
apresentou opção `Ativar`, nenhum bucket foi listado, Data Access padrão estava
desativado e o Monitoring não listou políticas de alerta. Esses fatos não
autorizam ativação ou criação e não substituem a revisão de herança, policies
específicas, outros projetos ou permissões efetivas.

## Classificação das evidências

- **CONFIRMADO REMOTAMENTE:** resposta Firebase obtida na Sprint 3.2I/3.2J-A;
- **VERIFICADO MANUALMENTE NO CONSOLE — EVIDÊNCIA INFORMADA:** observação manual
  fornecida para esta consolidação, sem reconfirmação nesta execução;
- **CONFIRMADO NO REPOSITÓRIO:** configuração versionada, que pode divergir do
  estado implantado;
- **NÃO VERIFICADO:** evidência insuficiente, escopo incompleto ou policy não
  examinada.

## Matriz consolidada

| Domínio | Estado consolidado | Classificação/evidência | Limitação ou ação pendente |
| --- | --- | --- | --- |
| Projeto | `PROSPERARE Flow`, ID `studio-4435305402-8a684`, nº `74851282547` | confirmado remotamente e manualmente informado | organização/folder e constraints não verificados |
| App Hosting | backend `prosperare-flow-oficial`, `us-central1`, origem Firebase App Hosting | confirmado remotamente/manual | preservar; não migrar nesta etapa |
| Cloud Run | serviço gerenciado homônimo, primeira geração, HTTPS, porta 8080 | verificado manualmente | imagem/runtime, revisões e tráfego detalhado ainda não documentados |
| Ingress/auth | ingress `Todos`; autenticação IAM exigida | verificado manualmente | ingress amplo não significa invocação anônima; policy e caminhos de acesso precisam de teste/read-only |
| Recursos | 1 vCPU, 512 MiB, concorrência 80, timeout 300 s | verificado manualmente | validar adequação apenas para backend atual, não para futura carga criptográfica |
| Escala | min 0, max 20 no Cloud Run | verificado manualmente | diverge do `maxInstances: 1` local; causa/configuração fonte não verificada |
| SA Cloud Run | App Hosting Service Account | verificado manualmente e associação remota | papéis/bindings efetivos ainda não consolidados |
| Segredo App Hosting | `GEMINI_API_KEY`, versão 1 | metadado remoto/manual; valor nunca acessado | não serve como cofre fiscal |
| Service accounts | Firebase App Hosting, Compute Engine padrão e Firebase Admin SDK; ativas; coluna de chaves `Nenhuma chave` | verificado manualmente | ausência de chave na coluna não substitui export de key metadata/policy; papéis precisam revisão |
| SA fiscal | não identificada na lista consultada | verificado manualmente no escopo da lista | criar somente em gate futuro aprovado; não inferir outros projetos |
| Principais humanos | existem no projeto | verificado manualmente, sem reproduzir identidades | papéis e necessidade devem ser revisados com mínimo privilégio |
| IAM | autenticação Cloud Run indicada; papéis humanos existem | verificado manualmente parcial | bindings completos, condições, herança e privilégios excessivos não consolidados |
| Storage | página acessível, nenhum bucket listado no projeto selecionado | verificado manualmente no escopo consultado | **NÃO ENCONTRADO NO ESCOPO CONSULTADO**, não prova ausência em outros projetos |
| KMS | página exibiu botão `Ativar` | verificado manualmente | API aparentemente não habilitada neste projeto; não afirmar outros projetos/recursos; nenhuma ativação |
| Secret Manager | somente identificador não fiscal acima confirmado | confirmado remotamente/manual | inventário e IAM completos ainda não verificados; payload não acessado |
| Firestore | padrão Standard `us-central1`; Enterprise em `us-central1` e `us-west1` | confirmado remotamente e manualmente | finalidade/custos dos Enterprise pendentes; não alterar bancos |
| PITR/delete protection | desabilitados nos três bancos | confirmado remotamente | risco de recuperação comprovado |
| Backup | nenhuma agenda identificada no banco padrão | confirmado remotamente | bancos nomeados/backups avulsos continuam não verificados |
| TTL | policies implantadas não verificadas | não verificado | TTL nunca substitui expiração lógica nem consumo atômico |
| Data Access padrão | Admin Read, Data Read e Data Write exibidos desativados; nenhuma isenção padrão | verificado manualmente | policies específicas/herdadas não verificadas; não confundir com Admin Activity |
| Monitoring | serviço acessível; 0 disparados, 0 reconhecidos, 0 políticas listadas | verificado manualmente | ausência de políticas no escopo/tela consultada; métricas e outros projetos não verificados |
| Billing | conta vinculada e budgets vistos anteriormente | histórico/manual anterior | custos reais, cobertura, limites e destinatários ainda não verificados |

## Divergências e observações

### App Hosting versus Cloud Run

- repositório: `maxInstances: 1`, timeout 300 s;
- Console: min 0, max 20, timeout 300 s, concorrência 80, 1 vCPU/512 MiB;
- timeout é coerente; máximo de instâncias é divergente;
- não alterar até identificar fonte de verdade, revisão ativa e comportamento do
  App Hosting ao reconciliar configurações.

### Ingress e autenticação

Ingress `Todos` aceita tráfego de qualquer origem de rede permitida pela
plataforma, mas a exigência IAM pode bloquear invocação não autenticada. O risco
potencial só será encerrado após revisar policy IAM, `run.invoker`, bindings
públicos, domínio hospedado e testes negativos autorizados. Não declarar o
serviço público ou privado apenas pelo campo ingress.

### IAM e chaves

A coluna `Nenhuma chave` reduz a evidência de chaves gerenciadas pelo usuário nas
três SAs consultadas, mas não substitui export de metadados de chaves, bindings,
herança e condições. Principais humanos não são reproduzidos neste documento.
Nenhuma SA fiscal exclusiva foi identificada no escopo consultado.

## Matriz de riscos

`P0` e `P1` indicam prioridade de tratamento arquitetural. Essas classificações
não constituem, por si, incidente de segurança confirmado, exploração, vazamento
ou acesso indevido. A coluna “Natureza” separa risco comprovado no escopo
consultado de risco potencial que ainda depende de evidência adicional.

| Risco | Natureza | Impacto | Probabilidade | Mitigação | Prioridade |
| --- | --- | --- | --- | --- | --- |
| max 1 local versus max 20 implantado | comprovado | alto: custo, escala e divergência de configuração | alta enquanto não reconciliado | identificar fonte de verdade e revisar sem alteração | P1 |
| IAM/ingress permitir caminho indevido | potencial; ingress/auth observados, policy incompleta | crítico | média | export read-only da policy, bindings públicos e teste negativo | P0 |
| privilégios humanos/SAs excessivos | potencial; principais e SAs observados, roles incompletos | crítico | média | matriz de acesso, herança/conditions e remoção futura aprovada | P0 |
| ausência de SA fiscal exclusiva | comprovado no escopo consultado | crítico para isolamento futuro | alta se implantação avançar | gate específico, sem chave JSON e sem acesso inicial | P0 antes de criar serviço |
| Data Access padrão desativado | comprovado na configuração padrão | alto: lacuna de rastreabilidade | alta para serviços cobertos apenas pelo padrão | desenhar cobertura por serviço, custo/retenção e habilitação futura | P1 |
| nenhuma policy de alerta listada | comprovado no escopo consultado | alto: detecção tardia | alta no projeto/tela consultada | SLOs, alertas técnicos, segurança e custo em gate próprio | P1 |
| Firestore sem PITR/delete protection | comprovado | alto: perda/recuperação | média | aprovar RPO/RTO, proteção, backup e restore sintético | P1 |
| banco padrão sem agenda de backup | comprovado | alto | média | plano de backup/restore aprovado | P1 |
| bancos Enterprise sem finalidade | comprovado quanto à existência; finalidade desconhecida | médio/alto: custo e governança | alta | identificar donos, uso, retenção e custo | P1 |
| KMS aparentemente não habilitado | comprovado pela tela `Ativar`, limitado ao projeto | crítico para futuro cofre | alta se cofre avançar | decisão/ativação apenas em gate futuro | P0 antes do cofre |
| nenhum bucket listado | comprovado no escopo consultado | alto para futuro cofre; sem impacto atual autorizado | alta se armazenamento avançar | bucket privado por ambiente apenas em gate futuro | P0 antes do cofre |
| infraestrutura fiscal independente ausente | comprovado apenas no inventário consultado | crítico para isolamento | alta | gates de identidade, Cloud Run, dados, auditoria | P0 |
| billing/budgets específicos não verificados | potencial | médio/alto | média | confirmar conta, cobertura, thresholds e destinatários | P1 |

## Custos e impacto financeiro

As evidências não incluem custos reais consolidados. Valores anteriores continuam
estimativas, não orçamento aprovado ou autorização de gasto.

- max 20 não gera custo sozinho com min 0, mas amplia capacidade de gasto durante
  carga/abuso em relação ao limite local 1;
- Data Access pode aumentar ingestão/retenção de logs;
- alertas, PITR, backups, Storage, KMS e tráfego inter-região acrescentam custos;
- bancos Enterprise nomeados podem ter cobrança fora do free tier;
- manter serviço fiscal em `southamerica-east1` e backend/dados em regiões dos EUA
  pode gerar egress e latência.

Cenário preliminar mantido: 10 empresas US$ 0–2/mês, 50 US$ 1–8/mês, 200
US$ 5–25/mês, mais cerca de US$ 55–75/mês por ambiente se uma instância 1
vCPU/1 GiB ficar sempre aquecida. Recalcular após decisões de região, SLO,
retenção, backup, auditoria e teste de carga.

## Decisões humanas pendentes

- ambientes/projetos, região fiscal, responsáveis e fonte de custos;
- manter dados fiscais em região brasileira ou aceitar tráfego inter-região;
- fonte de verdade do `maxInstances` e limite aprovado;
- papéis humanos, bindings, herança e matriz de segregação de funções;
- RPO/RTO, PITR, delete protection, backups, retenção e legal hold;
- KMS software/HSM, custódia, rotação e destruição;
- finalidade dos bancos Enterprise e destino de grants/nonces;
- escopo/custo de Data Access, retenção e acesso de auditoria;
- SLOs, alertas, budgets, plantão e resposta a incidentes;
- aprovação jurídica/LGPD e responsáveis pela futura homologação.

## Plano da Sprint 3.2K — gates independentes

Nenhum gate foi executado. Cada gate exige aprovação humana específica e não
autoriza automaticamente o próximo.

| Gate | Escopo futuro | Dependências | Critério de aceite antes de avançar | Aprovação obrigatória |
| ---: | --- | --- | --- | --- |
| 1 | ambientes, região, custos e responsabilidades | inventário 3.2J-B aprovado | ADR assinada; projetos, owners, RPO/RTO, SLO e orçamento definidos | arquitetura, segurança, jurídico, fiscal e financeiro |
| 2 | IaC e revisão sem aplicação | Gate 1 | código IaC, plan, policy checks, rollback e custo revisados; zero `apply` | plataforma e segurança |
| 3 | SA fiscal exclusiva, sem chave JSON | Gate 2 e matriz IAM | plan aprovado; sem roles básicos, chaves ou acesso de dados inicial | IAM admin e segurança |
| 4 | IAM mínimo e autenticação entre serviços | Gate 3 | OIDC audience/subject, `run.invoker` restrito e testes positivos/negativos | segurança e backend |
| 5 | Cloud Run fiscal privado | Gate 4, imagem sintética e limites | ingress/policy privados, min/max/concorrência/timeout aprovados, escala zero e kill switch | plataforma, segurança e financeiro |
| 6 | Storage, KMS e persistência distribuída | Gate 5, retenção/RPO/RTO | envelope sintético, bucket privado, KEK, grants/nonces atômicos, rotação e restore testados | segurança, dados, jurídico e custódios KMS |
| 7 | auditoria, monitoramento, alertas e recuperação | Gates 1–6 | Data Access, redaction, retenção, SLOs, budgets, alertas, DR e runbooks exercitados | auditoria, segurança, operação e financeiro |

Mesmo após o Gate 7, certificados reais e emissão exigem Sprints próprias de
PKCS#12/ICP-Brasil, XMLDSIG/mTLS, integração oficial e homologação autorizada.

## Próxima sequência recomendada

1. revisão e aprovação humana deste documento;
2. completar exports read-only de IAM/policy e revisões/tráfego;
3. registrar ADR do Gate 1;
4. preparar IaC em modo plan no Gate 2;
5. prosseguir um gate por vez, sempre em Sprint autorizada e com evidência;
6. manter App Hosting atual sem migração e sem corrigir max instances nesta etapa.

## Parecer

O inventário é suficiente para planejar a 3.2K, mas não para executar qualquer
gate automaticamente. Os bloqueadores críticos são policy IAM detalhada,
identidade fiscal exclusiva, KMS/Storage, persistência distribuída e auditoria.

HTTP 503, kill switch e aplicação atual permanecem preservados. Nenhum A1 real,
upload, assinatura, emissão ou transmissão NFS-e foi utilizado ou habilitado.
