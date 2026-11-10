# Checklist de infraestrutura fiscal de produção

Este documento consolida as pendências das Sprints 3.2C, 3.2D e 3.2E. O
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
