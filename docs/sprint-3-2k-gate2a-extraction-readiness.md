# Sprint 3.2K / Gate 2A — preparação técnica da separação FLOW/FISCAL

## 1. Escopo e diagnóstico verificado

Este Gate é exclusivamente de análise, documentação e preparação de contratos.
Em 11 de novembro de 2026 foram confirmados:

- branch `feature/nfse-multiempresa-fase1`;
- HEAD `ee16eaf67a06c3e50ab3ef6a92126c67b97d6f94`;
- árvore de trabalho limpa antes desta documentação;
- leitura integral do plano do Gate 1 e do checklist de produção;
- inspeção local dos módulos fiscais, imports, consumidores, configurações e
  dependências instaladas.

Nenhuma consulta ou alteração remota foi realizada. Nenhum repositório, projeto,
recurso, contrato executável ou configuração de IaC foi criado. O App Hosting e
o projeto atuais não são objeto de migração. Upload e emissão continuam em HTTP
503, e o protótipo fiscal continua bloqueado em produção pelo kill switch.

### 1.1 Estado técnico atual

O código está dividido em quatro blocos:

1. **domínio e autorização FLOW** em `src/lib/fiscal`, acoplados a Firebase Auth,
   Firebase Admin e coleções Firestore (`users`, `clients`,
   `userCompanyAccess`, metadados e auditoria);
2. **fachadas Next.js** em `src/app/api/fiscal` e `src/app/api/nfse`, que validam
   o Firebase ID token, empresa e permissões antes de devolver HTTP 503 para
   upload/emissão;
3. **protótipo isolado sintético** em `services/fiscal-local`, com contratos Zod,
   autenticação HMAC sintética, grants/nonces em memória e bloqueio fora de
   desenvolvimento/teste;
4. **processamento NFS-e preliminar** em `src/lib/nfse` e `src/services/nfse`, com
   preparação de DPS, XMLDSIG/PEM e entrada PKCS#12 deliberadamente bloqueada.

Dependências externas relevantes observadas: Node.js `crypto`/`http`/`test`,
Next.js 15.5.9, Firebase 11.9.1, Firebase Admin 13.6.0, Zod 3.25.76 e
`xml-crypto` 6.4.0. O teste de regras usa Firebase Emulator. O protótipo local
consulta apenas `NODE_ENV`; não há configuração OIDC, endpoint fiscal ou
credencial produtiva no repositório. `apphosting.yaml` contém configuração do
FLOW e não deve ser copiado para o futuro FISCAL.

### 1.2 Acoplamentos que precisam ser quebrados antes da extração

- `src/lib/fiscal/server.ts` reúne autenticação, autorização, consulta de empresa
  e auditoria; a fronteira futura deve separar autorização de negócio FLOW de
  execução fiscal.
- `src/lib/fiscal/client.ts` mistura o helper genérico
  `authenticatedFiscalFetch` com DTOs fiscais. O helper é usado também por
  férias, rescisão, logins de cliente e permissões; esses consumidores não podem
  migrar por associação nominal. Seu desacoplamento e renomeação são
  pré-requisitos da extração.
- o teste do protótipo importa `src/lib/nfse/domain.ts`, cruzando as duas raízes;
  o bloqueio deve virar teste contratual independente em ambos os repositórios.
- tipos atuais são TypeScript internos, não um contrato versionado publicável.
- grants/nonces e cofre são adaptadores em memória; servem apenas para testes.
- metadados de credencial e `fiscalAuditLogs` estão hoje no Firestore do FLOW;
  a futura fonte fiscal e a projeção sanitizada para UI precisam de ownership e
  sincronização explícitos.
- `xml-crypto` está no `package.json` do FLOW; deve sair somente após o FISCAL
  possuir build, testes, SBOM e homologação equivalentes.

## 2. Responsabilidades e estrutura dos repositórios

### 2.1 `prosperare-flow` existente

- interface, navegação e experiência do usuário;
- Firebase Authentication de funcionários/clientes;
- usuários, empresas, vínculos, perfis e permissões de negócio;
- processos administrativos e mensais;
- validação inicial do ator e emissão controlada de grant fiscal;
- fachada BFF para o navegador, cliente OIDC do FISCAL e projeções sanitizadas;
- isolamento de falhas, circuit breaker e continuidade dos módulos não fiscais.

O FLOW não armazenará PFX, senha, chave privada, XML assinado ou referência
interna do cofre fiscal.

### 2.2 futuro `prosperare-fiscal` — não criado

- API interna privada e autenticação OIDC/IAM;
- validação independente do grant, empresa, operação, nonce e idempotência;
- credenciais A1, PKCS#12/ICP-Brasil, assinatura XML e mTLS;
- preparação, transmissão e consulta NFS-e somente após homologação;
- state machine, idempotência, outbox e reconciliação fiscal;
- stores distribuídos, metadados fiscais, cofre por envelope e auditoria;
- observabilidade, retenção, backup e recuperação isolados.

Estrutura lógica proposta, sem criar diretórios:

```text
prosperare-fiscal/
  docs/
    adr/
    runbooks/
    threat-model/
  contracts/
    openapi/
    schemas/
    examples/synthetic/
  src/
    api/internal/v1/
    application/
    domain/
      authorization/
      credentials/
      nfse/
      reconciliation/
    infrastructure/
      auth/oidc/
      persistence/
      storage/
      kms/
      secrets/
      nfse-national/
      observability/
    security/
      redaction/
      validation/
  test/
    contract/
    integration/
    concurrency/
    security/
    fixtures/synthetic/
  infra/
    modules/
    environments/dev/
    environments/hml/
    environments/prd/
    policies/
  scripts/
    validation-only/
```

`infra/` é apenas organização futura. Este Gate não cria Terraform, scripts,
manifests, pipelines ou comandos capazes de provisionar recursos.

## 3. Mapa de dependências e destino

| Componente/caminho atual | Responsabilidade e dependências | Destino proposto | Impacto/critério de aceite | Rollback |
| --- | --- | --- | --- | --- |
| `src/lib/fiscal/types.ts`, `authorization.ts`, `access-profile-permissions.ts` e testes | operações, perfis e autorização; tipos internos | FLOW; publicar somente schemas de scopes no contrato | autorização FLOW continua fonte de verdade; contract tests cobrem todos os scopes | manter imports atuais e fachada 503 |
| `src/lib/fiscal/server.ts` | Firebase Admin/Auth, `users`, `clients`, `userCompanyAccess`, `fiscalAuditLogs` | FLOW, dividido futuramente em auth, grants e BFF | rotas administrativas continuam sem dependência do FISCAL; grant não aceita permissões do body | feature flag desligada e implementação atual preservada |
| `src/lib/fiscal/client.ts` | Firebase `User`, bearer token, empresas e metadados | FLOW; renomear fetch genérico antes da extração | férias, rescisão, logins e permissões mantêm comportamento | conservar export compatível durante janela de migração |
| `company-query.ts`, `migration.ts`, respectivos testes e `scripts/sprint-2-2-migration.ts` | consultas multiempresa e compatibilidade legada | FLOW | zero mudança de dados; isolamento multiempresa permanece coberto | não executar script nem remover compatibilidade |
| `firestore.rules`, índices e `firestore.rules.test.ts` | regras do banco FLOW; Firebase Emulator | FLOW | regras continuam protegendo dados administrativos; FISCAL terá policy/banco próprios | nenhuma publicação; manter regras atuais |
| `credentials.ts` e teste | metadados públicos, validação sintética e redaction | DTO público no contrato; validação/custódia no FISCAL | `secureStorageRef` e material sensível nunca atravessam a API | GET atual permanece local e upload em 503 |
| `src/lib/fiscal/vault/*` | cofre AES sintético via Node `crypto`, memória e kill switch | casos de teste adaptados; implementação substituída no FISCAL | envelope KMS/Storage, isolamento, rotação e restore sintético validados | manter cofre produtivo inexistente e 503 |
| `src/lib/nfse/domain.ts` e teste | draft, estados e bloqueio de transmissão | schemas/state machine no contrato; execução no FISCAL | versões e transições compatíveis; bloqueio testado nos dois lados | FLOW conserva `blockRealNfseTransmission()` |
| `src/services/nfse/dps-builder.service.ts` | construção XML sem validação XSD oficial | FISCAL após revisão | vetores/XSD oficiais, escaping e versão de leiaute aprovados | não integrar; manter emissão bloqueada |
| `src/services/nfse/nfe-nacional.service.ts` | `xml-crypto`, assinatura PEM; PFX lança erro | FISCAL após threat model e homologação | SCA/SBOM, vetores XMLDSIG, PKCS#12, ICP-Brasil e mTLS aprovados | não remover do FLOW antes de paridade; kill switch ativo |
| `services/fiscal-local/contracts.ts`, `audit-events.ts` | Zod, DTO sintético e eventos sanitizados | base conceitual para schemas versionados | OpenAPI/JSON Schema não expõem token, nonce, XML, PFX ou storage ref | manter contrato sintético local |
| `service-auth.ts` | HMAC sintético, issuer/audience/subject/expiração | interface adaptada; implementação substituída por OIDC | verificação Google/IAM e testes negativos aprovados | adaptador sintético exclusivo de teste |
| `grant-store.ts`, `nonce-store.ts` | maps em memória; unicidade só por instância | interfaces no FISCAL; adaptadores distribuídos futuros | transação/criação condicional, expiração lógica e concorrência multi-instância | memória apenas em testes; produção fechada |
| `isolated-fiscal-service.ts`, `http-server.ts`, `internal-client.ts` | orquestração sintética, Node HTTP, limite 2 KiB | aplicação FISCAL e cliente FLOW separados | contrato v1, OIDC, timeout, redaction e falha fechada validados | nenhum endpoint produtivo; manter bloqueio por ambiente |
| `fiscal-service.test.ts`, `README.md` | testes de auth/grant/replay/auditoria e dependência cruzada de bloqueio | suítes equivalentes em ambos os repositórios | mesma matriz de segurança mais contract tests e isolamento | testes atuais permanecem até paridade comprovada |
| `src/app/api/fiscal/empresas/route.ts` | lista empresas via Firebase token/Firestore | FLOW | continua disponível sem FISCAL | nenhuma alteração de rota |
| `src/app/api/fiscal/credenciais/route.ts` | metadados locais e POST 503 | BFF FLOW; futura projeção do FISCAL | browser nunca envia material ao FISCAL sem fluxo específico aprovado; 503 preservado | flag off e resposta atual |
| `src/app/api/nfse/emitir/route.ts` | valida usuário/empresa, prepara draft e retorna 503 | BFF FLOW + cliente interno futuro | identidade, grant, contrato e indisponibilidade testados; sem dupla emissão | flag off restaura 503 imediatamente |
| rotas `src/app/api/admin/*` e `src/app/api/portal/company-data/route.ts` que usam fiscal auth | administração de usuários/perfis e dados do portal | FLOW | inicializam e operam com FISCAL offline | proibir imports do cliente FISCAL nesses módulos |
| hooks/telas NFS-e e configuração fiscal | UX e consumo das fachadas | FLOW | estado degradado claro; sem detalhes internos ou retry ilimitado | manter upload/emissão desabilitados |
| `package.json`, lockfile e scripts de teste | Next/Firebase/Zod/`xml-crypto`, pipelines atuais | dividir só após repositório autorizado | builds independentes, licenses/SBOM e regressão equivalentes | não remover dependência/script antes do aceite |

Configurações futuras do FISCAL não devem reutilizar `GEMINI_API_KEY`, Firebase
web config, `apphosting.yaml` ou credenciais do FLOW. Nomes de variáveis
planejados devem carregar somente identificadores/configuração não secreta, como
ambiente, audience, projeto/banco, bucket e nomes KMS; valores e nomes finais
dependem do desenho de IaC e segurança do Gate 2B.

## 4. Contrato de integração proposto — especificação não executável

### 4.1 Princípios comuns

- base `/internal/v1`, somente backend a backend e sem CORS/navegador;
- `Authorization: Bearer <OIDC>` com issuer Google, audience exata da URL fiscal,
  subject em allowlist/IAM e expiração verificados;
- `X-Correlation-Id` UUID e `Idempotency-Key` opaca, sem dado pessoal;
- body JSON estrito, tamanho limitado e campos adicionais rejeitados;
- grant confiável curto, referenciado por `grantId`, nunca criado a partir de
  `permissions`, `role`, `companyId` ou headers autodeclarados do navegador;
- resposta e auditoria nunca contêm OIDC, grant bruto, nonce, PFX, senha, chave,
  XML assinado ou referência interna de Storage/KMS.

O `companyId` do request é apenas um seletor. O FISCAL deve exigir que ele seja
idêntico ao `companyId` do grant persistido e ativo, verificar que o grant foi
emitido ao mesmo subject OIDC e operação, e resolver internamente o tenant e a
credencial fiscal. Divergência fecha com 403 e auditoria sanitizada.

### 4.2 Endpoints v1

| Método e endpoint | Finalidade | Idempotência |
| --- | --- | --- |
| `POST /internal/v1/grants/{grantId}/credentials/{credentialId}:validate` | validar metadados/aptidão de credencial sintética ou autorizada | chave obrigatória; sem retornar material |
| `POST /internal/v1/grants/{grantId}/nfse/requests` | registrar pedido fiscal; transmissão continuará bloqueada até homologação | chave obrigatória por empresa + operação de negócio |
| `GET /internal/v1/nfse/requests/{requestId}` | consultar estado sanitizado | leitura segura, sem retry de transmissão |
| `POST /internal/v1/grants/{grantId}/nfse/requests/{requestId}:reconcile` | solicitar reconciliação controlada de estado ambíguo | chave obrigatória; não retransmite automaticamente |
| `GET /internal/v1/health/ready` | readiness interna mínima | não revela dependências, projetos ou dados |

Upload/cadastro A1 não é especificado neste Gate e permanece bloqueado. Exigirá
threat model e fluxo próprio que evite trânsito do material pelo navegador/Flow
sempre que tecnicamente possível.

### 4.3 Schemas conceituais

Pedido de emissão:

| Campo | Regra |
| --- | --- |
| `companyId` | ID opaco, 1–128; deve coincidir com grant e tenant interno |
| `operation` | enum versionado, inicialmente `NFSE_PREPARE_SYNTHETIC` |
| `businessReference` | ID opaco para idempotência/reconciliação, sem segredo |
| `payload` | dados fiscais mínimos definidos por schema versionado; sem PFX/senha |
| `correlationId` | UUID igual ao header ou rejeição |

Resposta de aceite: `success`, `requestId`, `state`, `contractVersion`,
`correlationId` e timestamps UTC. Estados iniciais planejados:
`RECEIVED`, `VALIDATED`, `BLOCKED_503`, `PROCESSING`, `RECONCILIATION_REQUIRED`,
`REJECTED` e, somente após homologação, estados oficiais adicionais. Não usar
`EMITTED` antes da definição e homologação da state machine oficial.

Erro padronizado: `success: false`, `code`, `message` sanitizada,
`correlationId`, `retryable` e opcional `retryAfterSeconds`. Códigos estáveis:
`INVALID_REQUEST` (400), autenticação inválida/expirada/audience (401), identidade,
grant ou empresa negados (403), inexistente (404), replay/idempotência conflitante
(409), capacidade (429), indisponibilidade/kill switch (503) e timeout (504).

### 4.4 Tempo, retry, circuit breaker e versões

- timeouts de conexão e total devem ser aprovados após teste de carga; o cliente
  FLOW usa orçamento menor que seu próprio timeout e cancela a chamada;
- retry máximo e valores finais continuam pendentes; somente 429/503/504
  transitórios e operação idempotente, com backoff exponencial, jitter e
  `Retry-After`; nunca 400/401/403/409 sem nova decisão;
- circuit breaker isolado das rotas administrativas, com estado degradado e sem
  fallback que processe certificado no FLOW;
- resposta desconhecida gera consulta/reconciliação, nunca retransmissão cega;
- `contractVersion` obrigatório; mudanças compatíveis adicionam campos opcionais,
  breaking changes criam `/v2`; suportar N e N-1 por janela aprovada;
- OpenAPI/JSON Schema versionados, exemplos exclusivamente sintéticos,
  consumer-driven tests e CI de compatibilidade antes de promover cada lado.

Auditoria correlaciona ator interno pseudonimizado, empresa, operação, decisão,
request/idempotency fingerprint, versão e resultado. Tokens, nonce bruto, payload
fiscal integral e material criptográfico são proibidos.

## 5. Estratégia de testes de isolamento e contrato

| Cenário | Injeção | Aceite no FLOW |
| --- | --- | --- |
| falha de rede/DNS/conexão recusada | cliente FISCAL fake | login, empresas, usuários, permissões e processos continuam 2xx/fluxo normal; fiscal degrada sem travar |
| timeout de conexão/resposta | servidor que não responde | cancelamento no prazo, sem fila infinita; circuit breaker contabiliza falha |
| HTTP 503 e `Retry-After` | stub determinístico | UI fiscal informa indisponibilidade; retries limitados/idempotentes; módulos administrativos intactos |
| indisponibilidade prolongada | circuito aberto | zero chamadas durante janela; health do FLOW permanece pronto; nenhuma inicialização depende do FISCAL |
| recuperação parcial/total | half-open e respostas válidas | sonda única/limitada, fechamento gradual e nenhum pedido duplicado |
| resposta perdida após aceite | timeout depois da persistência | consulta por idempotency key/reconciliação; nenhuma retransmissão cega |
| resposta malformada/versão incompatível | payload/schema inválido | falha fechada e sanitizada; sem crash do processo FLOW |
| OIDC/grant/empresa divergentes | tokens e grants sintéticos | 401/403, auditoria, nenhum efeito fiscal ou administrativo |
| concorrência/replay | mesmas chaves em paralelo | uma criação lógica; demais recebem resultado idempotente ou 409 |

Suítes obrigatórias futuras:

- **smoke de inicialização:** FLOW inicia com DNS fiscal inexistente e sem
  variáveis fiscais opcionais; rotas não fiscais ficam prontas;
- **regressão administrativa:** login, listagem de empresas, CRUD autorizado de
  usuários/perfis, processos mensais e módulos administrativos com FISCAL off;
- **contrato consumidor/provedor:** schemas, erros, headers, versões e redaction;
- **chaos controlado:** latência, reset, 429/503/504 e recuperação;
- **segurança:** forgery, audience/subject, grant expirado/revogado, company
  mismatch, replay, payload excessivo e dados proibidos;
- **observabilidade:** correlation ID sem segredo e alertas sem payload sensível.

O teste deve falhar se qualquer módulo administrativo importar o cliente FISCAL
ou se readiness do FLOW consultar o FISCAL.

## 6. Plano de extração em etapas — não executado

1. Aprovar este documento, owners, fronteiras e decisões pendentes.
2. No Gate 2B autorizado, produzir ADRs, OpenAPI/JSON Schema e IaC somente em
   validação/plan, ainda sem criar repositório ou recurso salvo autorização
   explícita que defina esse escopo.
3. Desacoplar e renomear o fetch autenticado genérico no FLOW, com regressão dos
   quatro consumidores administrativos.
4. Introduzir interfaces/cliente FISCAL atrás de feature flag desligada e
   manter HTTP 503 como comportamento efetivo.
5. Criar repositório separado somente após aprovação; preservar histórico por
   método Git revisado, sem remover os originais antes de paridade.
6. Publicar contrato e suítes sintéticas independentes; construir o runtime
   FISCAL sem certificado real nem transmissão.
7. Validar isolamento, IAM/OIDC, stores distribuídos e observabilidade em
   ambiente autorizado.
8. Migrar ownership módulo a módulo; cada corte exige aceite e rollback pela
   feature flag. Remover código/dependências do FLOW apenas após duas versões
   compatíveis e evidência de estabilidade.
9. PKCS#12, XMLDSIG/mTLS, homologação e produção continuam gates posteriores e
   autorizações independentes.

## 7. Organização futura de IaC — somente desenho

| Área | Organização/controle proposto | Aprovação/validação futura |
| --- | --- | --- |
| projetos/ambientes | projetos separados `dev`, `hml`, `prd`; state e identidades sem compartilhamento | nomes, billing, owners e policy de organização |
| Cloud Run | módulo privado, ingress/IAM restritos, limites, escala e kill switch parametrizados | plan/policy tests; sem acesso público |
| identidade/IAM | SAs distintas de deploy, runtime, invocação FLOW e auditoria; sem chaves/papéis básicos | matriz IAM e impersonation revisadas |
| Firestore/persistência | banco fiscal para grants, nonce, idempotência, state/outbox e metadados | atomicidade, índices, TTL apenas para limpeza, PITR/backup |
| Storage | bucket privado por ambiente para envelopes; PAP/UBLA, versão, lifecycle e retenção | restore sintético, localização e política legal |
| KMS | key ring/KEK por ambiente, custódia, rotação e proteção contra destruição | software versus HSM e cerimônia aprovados |
| Secret Manager | apenas segredos operacionais inevitáveis; acesso por versão/SA | inventário, rotação e proibição de segredo por A1 sem decisão |
| observabilidade | Logging/Data Access, métricas, traces, alertas, redaction e sinks separados | retenção, custo, acesso e testes de alerta |
| custo/capacidade | budgets, alertas, quotas, max instances e regiões | benchmark, Pricing Calculator e aprovação financeira |
| DR | backup, PITR, envelopes/KEK, RPO/RTO e runbooks | exercício de restore e região de recuperação |

Arquivos futuros devem separar módulos reutilizáveis de instâncias por ambiente,
usar backend de state aprovado, pin de providers e policy-as-code. Pipeline deve
executar format/validate/lint/security/cost/plan e exigir aprovação; `apply`
automático ou credencial persistente é proibido. Nenhum desses arquivos foi
gerado neste Gate.

## 8. Riscos e mitigação

| Risco | Nível | Mitigação/aceite |
| --- | --- | --- |
| extrair helper usado por módulos administrativos | crítico | inventário de consumidores, renomeação prévia e regressão de isolamento |
| confiar apenas no `companyId` do body | crítico | grant persistido vinculado a empresa, subject, operação e nonce; resolução interna do tenant |
| contrato divergir entre repositórios | alto | schemas versionados, consumer/provider CI e N/N-1 |
| retry duplicar emissão | crítico | idempotência atômica, state machine e reconciliação antes de retransmitir |
| FISCAL impedir inicialização/saúde do FLOW | crítico | dependência lazy, bulkhead, readiness independente e chaos tests |
| mover código sem histórico/paridade | alto | método Git aprovado, originals preservados e rollback por feature flag |
| vazar A1/senha/XML em logs ou contrato | crítico | allowlist, redaction tests, limites e proibição explícita |
| adaptar protótipo HMAC/memória como produção | crítico | adaptadores produtivos OIDC/stores distribuídos e falha fechada |
| IaC acidentalmente aplicável neste Gate | alto | somente documentação; nenhum manifesto, provider, script ou pipeline criado |
| região/custo definidos por premissa | alto | benchmark, residência, disponibilidade e orçamento aprovados antes do plan |

## 9. Critérios para autorizar o Gate 2B

O Gate 2B permanece **NÃO AUTORIZADO** até que todos sejam registrados:

- aprovação humana deste relatório e da fronteira de ownership;
- decisão sobre projetos/ambientes, região, billing, orçamento e responsáveis;
- RPO/RTO, SLO, retenção, backup, DR e requisitos LGPD;
- contrato v1 conceitual aprovado por FLOW, FISCAL, segurança e fiscal;
- estratégia de grant/tenant, idempotência, reconciliação e store distribuído;
- matriz IAM/OIDC e proibição de chaves JSON;
- método de preservação de histórico, licenças e política do novo repositório;
- plano de testes de isolamento com owners e evidência exigida;
- escopo explícito do Gate 2B, incluindo se poderá apenas documentar ou também
  criar schemas/IaC não aplicável; criação de repositório/recurso exige menção
  inequívoca e autorização própria;
- confirmação de que HTTP 503 e kill switch continuarão efetivos.

## 10. Decisões humanas pendentes e parecer

Permanecem pendentes: RACI, nomes/projetos, região, billing, quotas, budgets,
SLO/RPO/RTO, datastore, modelo de grant, contrato v1, timeouts/retries, janela
N/N-1, KMS software/HSM, retenção, DR, dependências PKCS#12/XMLDSIG, homologação
e política de acesso ao futuro repositório.

O código pode ser preparado para extração em Sprint futura, mas não está pronto
para migração produtiva. O principal pré-requisito técnico é desacoplar a
autenticação genérica do namespace fiscal e transformar tipos internos em
contratos versionados, mantendo a fachada HTTP 503. Este documento não autoriza
Gate 2B, criação do `prosperare-fiscal`, IaC executável, deploy, certificado real
ou qualquer mudança Google Cloud.
