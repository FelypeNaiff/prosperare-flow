# Checklist de infraestrutura fiscal de produção

Este documento consolida as pendências das Sprints 3.2C a 3.2G. O
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
