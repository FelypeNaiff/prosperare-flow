# Checklist de infraestrutura fiscal de produção

Este documento consolida as pendências das Sprints 3.2C a 3.2J-B. O
protótipo local não provisiona nem valida nenhum destes recursos.

## BLOQUEADORES PARA PRODUÇÃO

**Nenhum certificado A1 real poderá ser armazenado, recuperado ou utilizado
antes da aprovação e implementação dos controles obrigatórios abaixo.** Upload,
recuperação, assinatura e transmissão devem continuar bloqueados até homologação
formal. Este checklist deve ser retomado antes de qualquer provisionamento ou
homologação real.

- [ ] **PENDENTE — Cloud Run fiscal privado:** serviço sem acesso público,
  autenticação IAM, `run.invoker` restrito ao backend e concorrência limitada.
- [ ] **PENDENTE — Região brasileira:** confirmar `southamerica-east1` para o
  serviço fiscal, KMS e Storage, considerando que o App Hosting atual está em
  `us-central1`, além de latência, custo e residência dos dados.
- [ ] **PENDENTE — Cloud KMS:** ativação aprovada, key ring por ambiente, KEK
  simétrica, rotação, separação de funções e proteção contra destruição.
- [ ] **PENDENTE — Cloud Storage privado:** bucket por ambiente, Public Access
  Prevention, uniform bucket-level access, sem URLs assinadas, versionamento,
  lifecycle, retenção e recuperação definidos.
- [ ] **PENDENTE — Secret Manager:** limitar a segredos operacionais inevitáveis,
  acesso por versão e por service account; senha do PFX preferencialmente dentro
  do envelope cifrado, não como segredo individual.
- [ ] **PENDENTE — IAM e service accounts:** identidade fiscal exclusiva,
  papéis no menor recurso possível, sem papéis básicos e sem chaves JSON.
- [ ] **PENDENTE — Auditoria Data Access:** habilitar e validar acesso a KMS,
  Storage, Secret Manager e Cloud Run, com retenção e acesso de auditor separados.
- [ ] **PENDENTE — Logs e monitoramento:** redaction, correlation ID, métricas,
  alertas de falha, decrypt anômalo, alteração IAM, latência e disponibilidade.
- [ ] **PENDENTE — Orçamentos e alertas:** confirmar cobertura do projeto fiscal,
  limites, destinatários e resposta a desvios.
- [ ] **PENDENTE — Divergência de escala:** reconciliar `maxInstances: 1` do
  `apphosting.yaml` com o Cloud Run efetivo informado como 0–20 instâncias.
- [ ] **PENDENTE — Dependências e vulnerabilidades:** escolher biblioteca
  PKCS#12, fixar versões, gerar SBOM, executar SCA e definir SLA de correção.
- [ ] **PENDENTE — PKCS#12 e ICP-Brasil:** validar senha, MAC, cadeia, CNPJ,
  algoritmos, validade, CRL/OCSP e entradas malformadas, sempre em memória.
- [ ] **PENDENTE — Assinatura XML e mTLS:** homologar algoritmos, canonicalização,
  cadeia, agente TLS, timeouts e descarte de chaves/buffers.
- [ ] **PENDENTE — Homologação:** utilizar somente certificado específico de
  homologação aprovado, com idempotência, reconciliação e kill switch.
- [ ] **PENDENTE — Recuperação de desastres:** RPO/RTO, backup de metadados e
  envelopes, proteção da KEK, restauração sintética e runbook testado.
- [ ] **PENDENTE — Separação de ambientes:** projetos, chaves, buckets, SAs,
  segredos e logs independentes para desenvolvimento, homologação e produção.
- [ ] **PENDENTE — Revisão de segurança e LGPD:** threat model, retenção,
  consentimento/mandato, resposta a incidentes e aprovação independente.
- [ ] **PENDENTE — Inventário reconfirmado:** registrar projeto, billing account,
  backend App Hosting, branch de deploy, região, runtime, revisão Cloud Run,
  service accounts, CPU, memória, concorrência, timeout e escalonamento atuais.
- [ ] **PENDENTE — Banco distribuído fiscal:** decidir localização e isolamento do
  Firestore para grants, nonces, metadados e idempotência; criação condicional,
  consistência, TTL lógico e limpeza devem ser testados entre instâncias. O TTL
  não substitui verificação de expiração nem operação atômica de consumo único.
- [ ] **PENDENTE — Pipeline e cadeia de suprimentos:** imagem imutável, Artifact
  Registry, SBOM, SCA, proveniência, promoção entre ambientes e rollback.
- [ ] **PENDENTE — Idempotência de emissão:** chave de negócio, state machine,
  reconciliação com o provedor e política segura de retry antes de homologar.
- [ ] **PENDENTE — Kill switch e autorização de produção:** manter HTTP 503 até
  aceite formal, canário, rollback, plantão e autorização humana registrada.

## Gates da Sprint 3.2G

O plano detalhado está em `docs/sprint-3-2g-fiscal-infrastructure-plan.md`.
Antes de qualquer implementação, devem ser aprovados:

- projetos e responsáveis por desenvolvimento, homologação e produção;
- região fiscal e impacto do tráfego entre `us-central1` e
  `southamerica-east1`, entendida apenas como preferência inicial;
- datastore de grants/nonces, RPO/RTO, retenção e recuperação;
- KMS software ou HSM, rotação e separação de funções, reconhecendo que KMS
  protege o armazenamento mas não substitui a chave privada ICP-Brasil do A1;
- limites iniciais de Cloud Run, SLO e orçamento;
- bibliotecas PKCS#12/XMLDSIG e política de vulnerabilidades;
- municípios/provedores de homologação e responsáveis pela liberação.

As informações históricas de Console (App Hosting, Cloud Run, service account,
Secret Manager, faturamento e orçamentos) são **A CONFIRMAR** e não constituem
evidência atual de controle implementado. O App Hosting existente não será
migrado nesta etapa. Estimativas de custo não constituem orçamento aprovado.

## Inventário da Sprint 3.2H

O inventário detalhado está em
`docs/sprint-3-2h-infrastructure-inventory.md`. Como não houve consulta autorizada
ao estado atual do Google Cloud, permanecem **NÃO VERIFICADOS** ou
**HISTÓRICO — A CONFIRMAR**:

- projeto, backend, região, branch e runtime efetivos do App Hosting;
- serviços/revisões Cloud Run, ingress, CPU, memória, concorrência e escala;
- service accounts, chaves e bindings IAM atuais;
- buckets, key rings/keys, segredos fiscais e suas políticas;
- localização/configuração efetiva do Firestore, PITR e backups;
- Logging, Data Access, sinks, retenção, métricas e alertas;
- vínculo de faturamento, budgets, limites e destinatários atuais.

Antes de qualquer recurso, executar somente inventário read-only aprovado e
registrar evidência datada. Depois, aprovar ADR de ambientes/região e baseline de
IaC sem `apply`. Nenhum item histórico pode ser marcado como implementado sem
essa reconfirmação.

## Evidências remotas da Sprint 3.2I

O relatório completo está em
`docs/sprint-3-2i-remote-infrastructure-inventory.md`. Foram confirmados somente:

- projeto `studio-4435305402-8a684`, número `74851282547`, ativo;
- App Hosting `prosperare-flow-oficial` em `us-central1`, conectado ao repositório
  esperado e associado à service account padrão do App Hosting;
- referência gerenciada ao Cloud Run homônimo em `us-central1`, sem confirmação
  de CPU, memória, concorrência, escala, ingress, IAM, revisão ou tráfego;
- identificador não fiscal `GEMINI_API_KEY`, sem acesso ao payload;
- banco Firestore `(default)` Native Standard em `us-central1`, com PITR e delete
  protection desabilitados e sem agenda de backup;
- dois bancos `ai-studio-*`, um em `us-central1` e outro em `us-west1`, cuja
  finalidade, responsabilidade e custo precisam ser classificados.

Continuam **NÃO VERIFICADOS**: branch e rollouts do App Hosting, inventário total
do Cloud Run, service accounts/IAM, buckets, KMS, inventário completo de segredos,
TTL Firestore, Logging/Data Access, Monitoring, billing e budgets. A ausência de
ferramenta/permissão não comprova inexistência.

Nenhum item bloqueador foi concluído por este inventário. Antes de configurar
qualquer recurso, complementar IAM e policy/ingress do Cloud Run em consulta
somente leitura autorizada. HTTP 503 e kill switch permanecem obrigatórios.

## Inventário complementar da Sprint 3.2J-A

O relatório está em `docs/sprint-3-2j-a-cloud-security-inventory.md`. As
evidências Firebase foram reconfirmadas sem divergência, mas o complemento
Google Cloud permaneceu limitado porque:

- `gcloud` não está instalado no PATH nem nos caminhos usuais verificados;
- o Console disponível exigiu login e nenhuma autenticação nova foi iniciada;
- IAM, policy/ingress e recursos detalhados do Cloud Run continuam **NÃO
  VERIFICADOS**;
- Storage, KMS, Audit Logs/Data Access, Monitoring, billing e budgets continuam
  **NÃO VERIFICADOS**;
- ausência de visibilidade não comprova inexistência ou configuração segura.

PITR e delete protection permanecem remotamente confirmados como desabilitados
nos três bancos Firestore; o banco padrão continua sem agenda de backup. Isso é
risco documentado, não autorização para alterar configuração.

Antes da 3.2J-B, obter export somente leitura aprovado de Cloud Run/IAM e dos
demais domínios pendentes. Não instalar ferramenta, autenticar conta, ativar API
ou iniciar 3.2J-B sem autorização específica. Todos os bloqueadores de produção
permanecem abertos.

## Consolidação manual da Sprint 3.2J-B

O relatório está em `docs/sprint-3-2j-b-console-verified-inventory.md`. As
evidências abaixo foram **VERIFICADAS MANUALMENTE NO CONSOLE — EVIDÊNCIA
INFORMADA** e não reconfirmadas por consulta nesta execução:

- Cloud Run gerenciado em `us-central1`, primeira geração, HTTPS/porta 8080,
  autenticação IAM, ingress `Todos`, 1 vCPU, 512 MiB, concorrência 80, min 0,
  max 20 e timeout 300 s;
- ingress `Todos` não comprova invocação anônima; policy IAM e caminhos de acesso
  ainda exigem revisão específica;
- divergência entre max 20 implantado e `maxInstances: 1` no repositório;
- três service accounts ativas (App Hosting, Compute padrão e Firebase Admin SDK)
  com coluna de chaves indicando nenhuma chave; roles/bindings completos seguem
  pendentes e nenhuma identidade fiscal exclusiva foi identificada;
- nenhum bucket listado no projeto consultado;
- Cloud KMS apresentou opção `Ativar`, indicando API aparentemente não habilitada
  no projeto; nada foi ativado;
- Data Access padrão exibiu Admin Read, Data Read e Data Write desativados, sem
  isenções padrão; policies específicas/herdadas e Admin Activity são separados;
- Monitoring exibiu zero alertas disparados/reconhecidos e nenhuma policy listada;
- billing vinculado e budgets são evidência histórica/manual, mas custos,
  cobertura e destinatários continuam não verificados.

Nenhum bloqueador é considerado implementado por este inventário. A divergência
de escala não foi corrigida e os bancos existentes não foram alterados.
As prioridades P0/P1 do relatório não representam automaticamente incidentes de
segurança confirmados; distinguem urgência de tratamento e natureza da evidência.

### Gates documentais para a Sprint 3.2K

- [ ] Gate 1 — ambientes, região, custos e responsabilidades aprovados;
- [ ] Gate 2 — IaC e plan revisados, sem `apply`;
- [ ] Gate 3 — SA fiscal exclusiva, sem chave JSON;
- [ ] Gate 4 — IAM mínimo e OIDC entre serviços;
- [ ] Gate 5 — Cloud Run fiscal privado;
- [ ] Gate 6 — Storage, KMS e persistência distribuída;
- [ ] Gate 7 — auditoria, monitoramento, alertas e recuperação.

Cada gate exige autorização humana própria e permanece **PENDENTE**. Nenhum gate
foi executado nesta Sprint. HTTP 503 e kill switch continuam obrigatórios.

## Evidências locais da Sprint 3.2F — não produtivas

As abstrações abaixo foram demonstradas exclusivamente com dados sintéticos e
adaptadores em memória. Elas não alteram o estado **PENDENTE** dos controles
Google Cloud listados acima:

- contrato desacoplado para futura verificação de identidade OIDC;
- validação sintética de issuer, audience, subject, expiração e finalidade;
- armazenamento atômico local de nonce com TTL e rejeição concorrente;
- interface de persistência de grants com expiração, revogação e escopo;
- grants vinculados a identidade de serviço, empresa, ator, permissão e nonce;
- eventos estruturados sem token, segredo ou nonce bruto;
- falha fechada quando stores sintéticos ficam indisponíveis.

Para múltiplas instâncias do Cloud Run ainda é **PENDENTE** selecionar e aprovar
um armazenamento compartilhado com criação condicional atômica e expiração por
TTL para nonces e grants. Nenhum controle deve ser declarado implementado em
produção com base nestes testes locais.
