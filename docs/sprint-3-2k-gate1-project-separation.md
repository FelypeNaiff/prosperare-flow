# Sprint 3.2K / Gate 1 — planejamento da separação do PROSPERARE FISCAL

## 1. Escopo, método e estado verificado

Este documento é exclusivamente diagnóstico e planejamento. Em 11 de novembro
de 2026 foram confirmados localmente a branch
`feature/nfse-multiempresa-fase1`, o HEAD
`61e4d49f79d4c15dae5a3c75a3e9df00049177bf` e a árvore de trabalho limpa antes
desta documentação. Foram revisados `apphosting.yaml`, os módulos fiscais e de
NFS-e e os documentos das Sprints 3.2G, 3.2H, 3.2I, 3.2J-A e 3.2J-B.

As informações do Console presentes na 3.2J-B continuam classificadas como
**VERIFICADAS MANUALMENTE NO CONSOLE — EVIDÊNCIA INFORMADA**. Não houve nova
consulta remota nesta Sprint. O projeto `studio-4435305402-8a684`, o backend
`prosperare-flow-oficial`, sua região e configurações operacionais não foram
reconfirmados de forma independente nesta execução.

Nenhum repositório, projeto, recurso, identidade ou API foi criado ou alterado.
Nenhum código foi movido. Upload de A1 e emissão/transmissão continuam
respondendo HTTP 503, e o kill switch do protótipo local continua bloqueando
produção. O App Hosting existente não deve ser migrado neste Gate.

## 2. Decisão arquitetural proposta

A fronteira recomendada é separar experiência e autorização de negócio no
**PROSPERARE FLOW** de custódia e processamento criptográfico no futuro
**PROSPERARE FISCAL**. O navegador nunca invoca o serviço fiscal nem envia
identidade, permissões, PFX, senha ou chave privada diretamente a ele.

```text
Navegador
   | Firebase ID token
   v
FLOW / App Hosting existente
   | valida usuário, empresa e permissão; emite grant curto e idempotency key
   | OIDC de serviço (audience exata) + chamada privada versionada
   v
FISCAL / futuro Cloud Run privado
   | valida OIDC + IAM + grant + empresa + nonce + idempotência
   | usa stores distribuídos e cofre por envelope
   +--> Storage privado (envelope A1) + KMS (KEK) + metadados
   +--> API NFS-e Nacional, somente após homologação e autorização próprias
   +--> auditoria redigida, métricas e reconciliação
```

### 2.1 Responsabilidades

| Responsabilidade | FLOW existente | FISCAL futuro | Contrato/fronteira |
| --- | --- | --- | --- |
| Login, sessão, usuários e perfis | fonte de verdade | não autentica navegador | Firebase ID token termina no FLOW |
| Cadastro de empresas e vínculo multiempresa | fonte de verdade de negócio | recebe apenas identificador e escopo necessários | IDs opacos e contrato versionado |
| UI, processos e administração | permanece operacional | nenhuma UI pública | estado fiscal sanitizado, sem material sensível |
| Decisão inicial de autorização | valida ator e permissão; emite grant confiável | revalida grant e escopo | grant curto, ator, empresa, operação, nonce e expiração |
| A1, senha PFX e chave privada | proibidos | custódia/uso exclusivo | nunca retornam ao FLOW ou ao navegador |
| PKCS#12, ICP-Brasil, XMLDSIG e mTLS | não processa | responsabilidade exclusiva após gates próprios | resultado e códigos sanitizados |
| Comunicação oficial NFS-e | solicita e acompanha | transmite/reconcilia após homologação | API assíncrona/idempotente quando aplicável |
| Continuidade administrativa | continua mesmo com FISCAL indisponível | falha isolada | circuit breaker, timeout e status degradado |

O KMS protegerá a KEK usada na criptografia por envelope; ele **não substitui
automaticamente a chave privada ICP-Brasil** contida no A1. A chave privada será
extraída apenas em memória no processo fiscal autorizado, usada pelo menor tempo
possível e descartada sem logs, dumps ou persistência em claro.

## 3. Inventário e destino dos componentes atuais

Classificações: **FLOW** = permanece; **FISCAL** = candidato a extração futura;
**CONTRATO** = semântica compartilhada por OpenAPI/JSON Schema versionado, sem
pacote de implementação acoplado; **SUBSTITUIR** = protótipo que não deve ir para
produção como está. Nenhuma classificação autoriza movimentação neste Gate.

| Caminhos atuais | Função/dependências principais | Destino | Risco/condição de migração |
| --- | --- | --- | --- |
| `src/lib/fiscal/types.ts`; `authorization.ts`; `access-profile-permissions.ts`; respectivos `*.test.ts` | perfis, operações e grants de acesso do usuário | FLOW + CONTRATO | evitar duplicar fonte de verdade; mapear operações para scopes versionados |
| `src/lib/fiscal/server.ts`; `client.ts`; `company-query.ts`; `company-query.test.ts` | Firebase Auth/Admin, Firestore, chamadas autenticadas e seleção multiempresa | FLOW | não levar Firebase ID token ao FISCAL; preservar isolamento por empresa |
| `src/lib/fiscal/migration.ts`; `migration.test.ts`; `scripts/sprint-2-2-migration.ts` | compatibilidade/migração de vínculos de empresa | FLOW; descontinuar após janela aprovada | script não deve ser executado pelo Gate; definir critério de retirada |
| `src/lib/fiscal/firestore.rules.test.ts`; `firestore.rules`; `firestore.indexes.json` | proteção e consultas do domínio FLOW | FLOW | regras não protegem bancos do futuro projeto FISCAL; exigir policy própria |
| `src/lib/fiscal/credentials.ts`; `credentials.test.ts` | metadados públicos, validação sintética e redaction | separar: DTO público no CONTRATO; regras de A1 no FISCAL | `secureStorageRef` jamais deve sair do backend fiscal; validação atual não é ICP-Brasil real |
| `src/lib/fiscal/vault/domain.ts`; `simulated-vault.ts`; `vault.test.ts` | cofre sintético AES em memória | SUBSTITUIR por Storage + KMS + metadados FISCAL | demonstração local não atende custódia, rotação, IAM, DR ou multi-instância |
| `src/lib/nfse/domain.ts`; `domain.test.ts` | estados e bloqueio obrigatório HTTP 503 | CONTRATO; processamento no FISCAL | preservar `BLOQUEADO_TRANSMISSAO` até homologação; máquina de estados precisa versionamento |
| `src/services/nfse/dps-builder.service.ts` | monta XML DPS local | FISCAL | leiaute é preliminar; validar XSD, ambiente, campos, escaping e versão oficial |
| `src/services/nfse/nfe-nacional.service.ts` | XMLDSIG com PEM; entrada PFX lança erro | FISCAL, com revisão/substituição | não valida XSD/ICP-Brasil; `xml-crypto` e algoritmos exigem threat model, vetores oficiais e revisão de dependência |
| `services/fiscal-local/contracts.ts`; `audit-events.ts` | schemas sintéticos, erros sanitizados e eventos | CONTRATO + FISCAL | finalidade atual é só validação sintética; ampliar sem quebrar clientes e sem dados sensíveis |
| `services/fiscal-local/service-auth.ts` | verificador/issuer HMAC sintético | SUBSTITUIR por OIDC Google no FISCAL | segredo HMAC local não é identidade produtiva; validar issuer, audience, subject, `exp` e clock skew |
| `services/fiscal-local/grant-store.ts`; `nonce-store.ts` | grants e nonces em memória | interfaces no FISCAL; adaptadores SUBSTITUIR | memória não funciona entre instâncias; operação condicional atômica e expiração lógica obrigatórias |
| `services/fiscal-local/isolated-fiscal-service.ts`; `http-server.ts`; `internal-client.ts` | orquestração sintética, servidor local e cliente | FISCAL + CONTRATO; servidor local SUBSTITUIR | bloqueado em produção; criar runtime Cloud Run, limites e política de falha fechada |
| `services/fiscal-local/fiscal-service.test.ts`; `README.md` | testes de OIDC sintético, grants, replay, auditoria e bloqueios | migrar/adaptar para suíte do FISCAL; manter regressão no FLOW durante transição | testes locais não comprovam IAM/OIDC/atomicidade multi-instância reais |
| `src/app/api/fiscal/empresas/route.ts` | lista empresas acessíveis | FLOW | não depende do FISCAL; deve continuar disponível em indisponibilidade fiscal |
| `src/app/api/fiscal/credenciais/route.ts` | metadados e upload bloqueado em 503 | fachada FLOW + CONTRATO | futura operação deve encaminhar fluxo seguro sem receber/registrar PFX indevidamente; 503 permanece |
| `src/app/api/nfse/emitir/route.ts` | autorização e emissão bloqueada em 503 | fachada FLOW + CONTRATO | só trocar por chamada privada após gates e homologação; manter kill switch independente |
| `src/app/api/admin/fiscal-access/route.ts`; `access-profiles/route.ts`; `client-logins/route.ts`; `src/app/api/portal/company-data/route.ts` | administração de acesso e dados do portal | FLOW | rotas administrativas não podem ficar dependentes da saúde do FISCAL |
| `src/hooks/use-accessible-companies.ts`; `use-authorized-company-collection.ts`; `src/components/nfse/EmissaoNfseModal.tsx`; `src/app/(dashboard)/fiscal/configuracoes/page.tsx`; `src/app/portal/nfse/page.tsx` | UX e consumo das fachadas | FLOW | mostrar indisponibilidade sem retry agressivo nem exposição de detalhes internos |
| `src/app/portal/rescisao/page.tsx`; `src/app/portal/ferias/page.tsx`; `src/app/(dashboard)/login-cliente/page.tsx`; `src/app/(dashboard)/equipe/permissoes/page.tsx` | consumidores do helper genérico `authenticatedFiscalFetch` | FLOW; renomear/desacoplar em refatoração futura | o nome fiscal não torna essas funções responsabilidade do FISCAL; evitar migrar autenticação/UI por associação nominal |
| `package.json` scripts `test:authorization`, `test:rules`, `test:multiempresa`, `test:nfse`, `test:fiscal-service` e dependência `xml-crypto` | regressão e dependência criptográfica | dividir futuramente entre pipelines | preservar cobertura durante extração; lockfile, SBOM e alertas de vulnerabilidade no FISCAL |
| documentos `docs/sprint-3-2a-credential-architecture.md`, `sprint-3-2b-vault-architecture.md`, `sprint-3-2g-*` a `sprint-3-2j-b-*` e checklist | decisões, inventários e bloqueadores | compartilhar como histórico; ADRs novos por repositório | evidência histórica não prova estado atual; evitar divergência documental |

Artefatos com “fiscal” no nome mas ligados a relatórios/análise contábil geral,
como `src/lib/fiscal-report-pdf.ts` e fluxos de IA, permanecem no FLOW até uma
análise de domínio separada; não manipulam o A1 por definição deste Gate.

## 4. Integração segura e resiliente

### 4.1 Identidade, autorização e replay

1. O backend FLOW valida o Firebase ID token, o vínculo ativo, a empresa e a
   permissão; dados autodeclarados pelo navegador nunca geram um grant.
2. Uma identidade exclusiva do backend FLOW obtém token OIDC para a URL/audience
   exata do FISCAL. Somente ela recebe futuramente `roles/run.invoker` no serviço
   fiscal; usuários e identidades padrão não recebem.
3. O FISCAL valida assinatura/issuer Google, audience, subject permitido,
   expiração e horário, antes de consultar o grant.
4. O grant confiável é curto, revogável e vinculado a `grantId`, ator, perfil,
   empresa, operação, subject chamador, nonce e expiração.
5. Nonce e idempotency key usam criação condicional/transação atômica em store
   compartilhado. TTL apenas limpa dados: **não substitui verificação explícita
   de expiração nem operação atômica**.
6. Falha de OIDC, grant, nonce, store ou auditoria obrigatória fecha o acesso.

Grants, nonces e idempotência devem ficar no projeto/ambiente FISCAL, com banco
dedicado e sem leitura direta pelo navegador. O FLOW solicita grants por canal
autenticado ou usa uma interface de emissão controlada; a escolha exata e o
datastore permanecem decisões do Gate 2/6.

### 4.2 API versionada

- base proposta: `/internal/v1`; breaking changes criam `/v2` e período de
  compatibilidade explícito;
- entrada: `companyId`, operação, payload mínimo, `correlationId` e
  `Idempotency-Key`; nunca permissões autodeclaradas, PFX ou senha nas operações
  normais de emissão;
- resposta: status de domínio sanitizado, identificador fiscal opaco e
  `correlationId`; nunca token, grant, nonce, XML assinado, certificado, senha,
  chave privada ou referência interna de storage;
- erros estáveis: 400 inválido, 401 identidade, 403 grant/escopo, 409 replay ou
  idempotência conflitante, 429 capacidade, 503 dependência/kill switch e 504
  timeout; mensagens externas não revelam infraestrutura;
- contrato publicado por OpenAPI/JSON Schema, consumer-driven tests e matriz de
  compatibilidade entre versões FLOW/FISCAL.

### 4.3 Timeout, retry e continuidade

- orçamento de tempo menor que o timeout externo do FLOW; conexão e resposta
  têm limites separados e cancelamento propagado;
- retry somente para falhas transitórias e operações comprovadamente
  idempotentes, com backoff exponencial, jitter, limite baixo e respeito a
  `Retry-After`; nunca repetir falha de autenticação/autorização/validação;
- circuit breaker por dependência/ambiente, bulkhead e limite de concorrência;
- comando de emissão aceita idempotency key única por empresa/operação e retorna
  o mesmo resultado conhecido, sem retransmitir;
- para operações longas, preferir aceite assíncrono e consulta de status, com
  outbox/reconciliação aprovadas, a manter requisição aberta;
- com FISCAL indisponível, FLOW mantém login, cadastros, empresas, usuários,
  perfis e processos; telas fiscais exibem estado degradado, sem fallback que
  manipule certificado no FLOW;
- reconciliação compara pedidos/resultados por correlation/idempotency key,
  registra divergências sem dados sensíveis e exige ação humana para estados
  ambíguos. Nenhum retry automático deve causar dupla emissão.

## 5. Ambientes, projetos e recursos propostos

O projeto atual e o App Hosting permanecem inalterados. Para reduzir blast
radius, a preferência é projeto fiscal separado por ambiente:

| Ambiente | Nome lógico proposto (não criado) | Uso e regra |
| --- | --- | --- |
| desenvolvimento | `prosperare-fiscal-dev` | somente dados/certificados sintéticos; acesso de desenvolvedor auditado |
| homologação | `prosperare-fiscal-hml` | credencial oficial de homologação somente após autorização e custódia aprovadas |
| produção | `prosperare-fiscal-prd` | sem acesso humano rotineiro; promoção controlada e break-glass auditado |

Recursos futuros por ambiente: Cloud Run privado `prosperare-fiscal`, SA de
runtime `sa-fiscal-runtime`, SA invocadora do FLOW, Firestore/banco transacional
dedicado para grants/nonces/idempotência/metadados, bucket privado para envelopes,
key ring/KEK KMS, Secret Manager apenas para segredos operacionais inevitáveis,
Artifact Registry, Logging/Audit/Monitoring, budgets e alertas. SAs de deploy,
runtime e auditoria devem ser distintas, sem chaves JSON e sem papéis básicos.

`southamerica-east1` é somente preferência inicial, não decisão definitiva. A
escolha depende de disponibilidade de todos os serviços, residência/LGPD,
latência medida até o App Hosting atual em `us-central1` e endpoints oficiais,
egress, custo, DR e requisitos contratuais. Não se propõe migrar o App Hosting.

## 6. Migração gradual e reversível

| Etapa futura | Dependências | Critério de aceite | Reversão segura |
| --- | --- | --- | --- |
| 1. aprovar ADR e ownership | este plano | projetos/ambientes, RACI, região, RPO/RTO, SLO e orçamento assinados | manter arquitetura atual e 503 |
| 2. preparar repositório privado `prosperare-fiscal` | aprovação específica; política de acesso | proteção de branch, CODEOWNERS, CI sem segredo, SBOM e scanning | arquivar repositório vazio; nenhuma produção afetada |
| 3. publicar contrato v1 | owners FLOW/FISCAL | OpenAPI/schema, erros, idempotência e testes de consumidor aprovados | FLOW continua usando 503/fachada atual |
| 4. extrair protótipo preservando história | contrato e revisão jurídica/licenças | histórico rastreável, build/testes sintéticos independentes, nenhum segredo | remover integração experimental; manter código fonte original até aceite |
| 5. implementar identidade e stores sintéticos/distribuídos em ambiente isolado | Gates IAM/OIDC e dados | testes de subject/audience, multiempresa, replay concorrente e falha fechada | revogar invoker/desativar serviço; FLOW não muda |
| 6. integrar FLOW por feature flag desligada | serviço sintético privado | contract tests, timeout/retry/circuit breaker e indisponibilidade aprovados | flag off restaura 503 imediato |
| 7. implementar cofre e PKCS#12 com material sintético | Storage/KMS/auditoria aprovados | envelope, rotação, descarte, restore e isolamento validados | negar IAM, suspender ingestão, preservar evidência auditável |
| 8. XMLDSIG/mTLS e integração oficial de homologação | validação ICP-Brasil, XSD e autorização fiscal | vetores oficiais, mTLS, idempotência, reconciliação e testes de homologação | kill switch, revogação de acesso e retorno a modo sem transmissão |
| 9. liberação produtiva | aprovação humana nova após todos os gates | go/no-go assinado, DR/observabilidade/on-call exercitados | kill switch e rollback de versão sem mover A1 ao FLOW |

Testes mínimos em cada corte: contrato bidirecional; isolamento multiempresa;
negação de identidade/empresa/permissão; grant expirado/revogado; replay paralelo;
idempotência; timeout; circuit breaker; store/auditoria indisponível; redaction;
kill switch; continuidade das funções administrativas do FLOW; restore e
reconciliação. Preservar história significa extração por estratégia Git aprovada
(`filter-repo`/subtree ou equivalente) em Sprint própria, nunca cópia sem
rastreabilidade nem reescrita do repositório atual sem backup e revisão.

## 7. Custos preliminares e riscos

As faixas históricas das 3.2G–3.2J-B — 10 empresas: US$ 0–2/mês; 50: US$ 1–8;
200: US$ 5–25, mais cerca de US$ 55–75/mês por ambiente com uma instância 1
vCPU/1 GiB sempre aquecida — são **estimativas, não orçamento aprovado**. Elas
não foram recalculadas nem validadas contra consumo real nesta Sprint e podem
subestimar a separação em três projetos.

Recalcular antes do Gate 2 com região, carga, concorrência, min/max instances,
Build/Artifact Registry, Firestore/PITR/backups, Storage/versionamento, KMS
software ou HSM, Secret Manager, Data Access/retenção, egress inter-região,
observabilidade, suporte, impostos, câmbio e provedores externos. Free tier é
compartilhado/condicional e não deve sustentar orçamento. Cada projeto precisa de
billing, budget, alertas e quota/capacidade aprovados; limites são proteção, não
garantia de gasto máximo.

| Risco | Criticidade | Tratamento/gate |
| --- | --- | --- |
| PFX/chave/senha vazarem ao FLOW, logs ou dumps | crítico | fronteira estrita, redaction, memória efêmera, DLP/testes e Gate 6 |
| dupla emissão por retry ou estado ambíguo | crítico | idempotência atômica, consulta/reconciliação e homologação |
| bypass por header, token de usuário ou grant forjado | crítico | OIDC backend-backend, invoker mínimo, grant confiável e testes negativos |
| replay entre instâncias | crítico | store compartilhado, operação atômica e expiração verificada; TTL só limpeza |
| indisponibilidade fiscal derrubar administração | alto | bulkhead, circuit breaker e nenhuma dependência fiscal nas rotas administrativas |
| divergência de contrato entre repositórios | alto | schema versionado, CI de consumidor e janela de compatibilidade |
| região causar latência/egress ou violar requisito | alto | benchmark e decisão humana antes de provisionar |
| dependência criptográfica vulnerável/incorreta | alto | pin/lock, SBOM, scanning, vetores oficiais, revisão especializada e plano de troca |
| projeto/SA cruzar ambientes | crítico | projetos e identidades distintas, deny policy/CI e revisão IAM periódica |
| auditoria conter dado sensível | alto | allowlist de campos, hashing controlado, testes de redaction e acesso segregado |

## 8. Decisões humanas pendentes

1. aprovar a fronteira FLOW/FISCAL e os owners/RACI de produto, segurança,
   plataforma, fiscal, jurídico/LGPD, finanças e resposta a incidentes;
2. aprovar repositório separado, política de acesso e método de preservação do
   histórico/licenças;
3. aprovar quantidade/nome dos projetos, billing, budgets, quotas e separação de
   dev/hml/prod;
4. decidir região após benchmark e requisitos legais; `southamerica-east1` não
   está escolhida definitivamente;
5. aprovar RPO, RTO, SLO, retenção, PITR, backups, legal hold e DR regional;
6. escolher store distribuído e modelo transacional de grants, nonces,
   idempotência e outbox;
7. aprovar matriz IAM, SAs, break-glass, segregação de funções e custódios KMS;
8. escolher KMS software/HSM, rotação/destruição, envelope e tratamento da senha
   PFX;
9. aprovar contrato v1, semântica de retry/timeout/reconciliação e versionamento;
10. aprovar dependências PKCS#12/XMLDSIG/mTLS, fornecedor/API oficial, credencial
    de homologação e critérios formais de go/no-go.

## 9. Parecer para o Gate 2

O Gate 1 produz base suficiente **para revisão humana**, mas não está aprovado
automaticamente e não autoriza o Gate 2. O Gate 2 pode ser iniciado somente por
Sprint específica após decisões 1–5 acima, e deve limitar-se a preparar o
repositório/ADRs e IaC em modo de validação/plan, sem `apply`, credencial real ou
integração produtiva.

Até essa aprovação, permanecem obrigatórios HTTP 503 para upload e emissão, kill
switch, ausência de certificados reais e nenhuma alteração no App Hosting,
Firebase ou Google Cloud atuais.
