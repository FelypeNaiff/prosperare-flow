# Sprint 3.2K / Gate 2B.2 — contrato independente FLOW ↔ FISCAL V1

## 1. Escopo e verificação inicial

Trabalho exclusivamente local para definir schemas, tipos, validadores e testes
de contrato. Em 11 de novembro de 2026 foram confirmados:

- branch `feature/nfse-multiempresa-fase1`;
- HEAD `3f64662761654b012049e5fc9d1e6963e5db132f`;
- árvore de trabalho limpa antes da implementação;
- documentos dos Gates 1, 2A e 2B.1 disponíveis.

Nenhum endpoint importa ou executa o novo contrato. Não houve migração, conexão
externa, deploy, provisionamento, certificado real ou transmissão fiscal. HTTP
503, kill switch e funcionamento independente do FLOW permanecem inalterados.

## 2. Inventário inicial e matriz de dependências

A matriz abaixo foi produzida antes da alteração de código.

| Área existente | Contratos/tipos implícitos | Dependências | Acoplamento/risco identificado |
| --- | --- | --- | --- |
| `src/lib/fiscal/types.ts` | operações, permissões, usuário, vínculo e empresa acessível | TypeScript interno | combina modelo de UI/Firestore com autorização de negócio do FLOW |
| `src/lib/fiscal/authorization.ts` | regras de perfil, empresa e operação | tipos fiscais internos | regra FLOW; não deve ser duplicada nem exportada como contrato wire |
| `src/lib/fiscal/server.ts` | Firebase token, consultas, auditoria e autorização | Firebase Admin/Auth/Firestore e alias Next | implementação FLOW, imprópria para pacote compartilhado |
| `src/lib/fiscal/client.ts` | DTO de empresas/metadados | Firebase Client por meio do transporte genérico | cliente BFF do FLOW; não é contrato entre serviços |
| `src/lib/fiscal/credentials.ts` e `vault/*` | metadados, cofre e leases sintéticos | Node `crypto` e domínio interno | material sensível e persistência não podem atravessar o contrato |
| `src/lib/nfse/domain.ts` | draft, prestador/tomador, estados e bloqueio 503 | TypeScript puro, mas regra local | estados em português e detalhes do draft não formam envelope versionado |
| `services/fiscal-local/contracts.ts` | request/response sintéticos, erro e purpose | Zod | melhor base portátil, porém finalidade única e sem idempotência/versionamento |
| `service-auth.ts`, `grant-store.ts`, `nonce-store.ts` | identidade sintética, grant e nonce | Node crypto e memória | autenticação/persistência são adaptadores, não contrato wire |
| `isolated-fiscal-service.ts` e clientes HTTP | ordem de validação e falha fechada | Node, stores e contratos locais | contém dependência de runtime e não pode ser compartilhado como schema |
| rotas `src/app/api/fiscal/*` e `src/app/api/nfse/emitir` | JSON implícito e status HTTP | Next.js, Firebase Admin e regras FLOW | contratos não versionados; permaneceram intocados |
| testes atuais | autorização, cofre, NFS-e, multiempresa e Firestore | Node test, Firebase Emulator | teste fiscal importa `src/lib/nfse/domain.ts`, dependência cruzada ainda existente |

Estados observados antes do Gate:

- domínio NFS-e: `RECEBIDO`, `VALIDADO`, `CREDENCIAL_VALIDADA`, `DPS_GERADA`,
  `XSD_VALIDADO`, `ASSINADO`, `BLOQUEADO_TRANSMISSAO`;
- protótipo sintético: `SYNTHETIC_VALIDATED`;
- emissão real: obrigatoriamente bloqueada em HTTP 503, sem estado `EMITIDA`.

## 3. Arquitetura do contrato V1

O contrato foi criado em `contracts/fiscal/v1.ts`, fora de `src`, rotas e
serviço local. Ele importa somente Zod e não conhece React, Next.js, Firebase,
Firestore, variáveis de ambiente, UI ou persistência.

```text
JSON wire não confiável
  -> fiscalCommandV1Schema
                 + identidade produzida por adaptador OIDC confiável
                 + grant carregado de persistência confiável
  -> validateFiscalTrustBindingsV1
  -> aplicação fiscal futura (não implementada neste Gate)
  -> fiscalSuccessResponseV1Schema | fiscalErrorResponseV1Schema
```

As três fronteiras são deliberadamente distintas:

1. **comando wire:** identificadores e payload fiscal mínimo; nunca identidade,
   perfil, role, scope ou permissões declaradas pelo chamador;
2. **identidade verificada:** representação normalizada do resultado de um
   adaptador OIDC; o schema não verifica token nem autentica sozinho;
3. **grant confiável:** registro recuperado por implementação externa; nunca é
   aceito integralmente no body do comando.

Autenticação, decisão de autorização, consumo atômico de nonce, replay,
idempotência e persistência continuam responsabilidades externas. O validador do
contrato apenas confirma que os identificadores atravessando essas fronteiras
estão vinculados corretamente.

## 4. Schemas, tipos e validadores

### 4.1 Comando

`fiscalCommandV1Schema` é estrito e contém:

| Campo | Regra |
| --- | --- |
| `contractVersion` | literal `1.0` |
| `operationId` | UUID da instância da operação |
| `operation` | enum `VALIDATE_CREDENTIAL`, `PREPARE_NFSE`, `GET_NFSE_STATUS` ou `RECONCILE_NFSE` |
| `correlationId` | UUID para rastreabilidade ponta a ponta |
| `idempotencyKey` | 16–128 caracteres seguros |
| `companyId` | identificador opaco, não prova autorização |
| `grantId` | referência ao grant confiável persistido |
| `nonceId` | UUID vinculado ao grant e à operação |
| `payload` | objeto fiscal genérico validado contra campos de autorização autodeclarados |

A busca recursiva rejeita no payload `permission(s)`, `role(s)`, `profile(s)`,
`scope(s)`, `serviceIdentity`, `serviceSubject` e `authenticatedIdentity`. Campos
extras no envelope também são rejeitados.

### 4.2 Identidade e grant

`verifiedServiceIdentityV1Schema` contém issuer, audience, subject, emissão e
expiração. Esses valores só são confiáveis depois de verificação OIDC externa.

`trustedFiscalGrantV1Schema` contém grant/ator/empresa/operação, subject de
serviço destinatário, nonce, emissão, expiração e revogação opcional. Não existe
array de permissões fornecido pelo cliente: a operação única é definida pelo
componente emissor confiável.

`validateFiscalTrustBindingsV1` exige simultaneamente:

- identidade vigente;
- identidade e grant com expiração posterior à emissão, sem grant emitido no futuro;
- `grantId` do comando igual ao grant carregado;
- subject OIDC igual ao destinatário do grant;
- grant não revogado nem expirado;
- empresa do comando igual à empresa do grant;
- operação do comando igual à operação do grant;
- nonce do comando igual ao nonce do grant.

Assim, `companyId` isolado nunca autoriza a operação. O consumo único do nonce e
a idempotência atômica ainda deverão ser implementados por stores externos.

### 4.3 Respostas e erros

A resposta comum inclui versão, operation ID e correlation ID.

Sucesso acrescenta empresa, request ID e um dos estados:
`RECEIVED`, `VALIDATED`, `SYNTHETIC_VALIDATED`, `BLOCKED_503`,
`RECONCILIATION_REQUIRED` ou `REJECTED`. `EMITTED`/`EMITIDA` não fazem parte do
V1, preservando o bloqueio de emissão real.

Erro acrescenta código estável, mensagem sanitizada de até 160 caracteres,
`retryable` e `retryAfterSeconds` opcional limitado a uma hora. Os códigos
cobrem request/versão, autenticação, identidade, grant, empresa, operação,
nonce/replay, idempotência, inexistência, indisponibilidade, timeout e bloqueio
de produção. Stack trace e detalhes de infraestrutura não fazem parte do schema.

## 5. Versionamento e compatibilidade

- versão publicada inicial: `1.0`;
- o parser atual aceita exatamente `1.0`;
- `isFiscalContractVersionCompatibleV1` reconhece a família `1.x` para
  negociação; aceitar um minor novo exige que o consumidor atualize seu parser
  e seus contract tests antes da promoção;
- campos obrigatórios não podem ser removidos ou reinterpretados dentro do V1;
- mudanças incompatíveis exigem `/v2`/major `2.x` e janela N/N-1 aprovada;
- enums são fechados: novo valor exige atualização coordenada, mesmo no mesmo
  major, para evitar interpretação silenciosa;
- serializadores sempre validam antes de gerar JSON; desserializadores validam
  após `JSON.parse` e rejeitam conteúdo malformado.

O contrato ainda não define endpoint. O mapeamento HTTP/OpenAPI e a negociação
real de versão dependem de Gate posterior.

## 6. Limites de confiança

| Dado | Origem | Confiança necessária |
| --- | --- | --- |
| comando/payload/IDs | rede interna | não confiável; validar schema e tamanho no adaptador HTTP |
| `companyId` | comando | seletor apenas; confrontar com grant e tenant persistido |
| identidade | token OIDC | validar assinatura, issuer, audience, subject e tempo antes de normalizar |
| grant | store fiscal | emitir por componente confiável; verificar expiração/revogação e vínculos |
| nonce | comando + grant/store | confrontar com grant e consumir atomicamente no store |
| idempotency key | comando + store | registrar atomicamente por empresa/operação; não confiar só na string |
| resposta | serviço fiscal | validar schema no provedor e novamente no consumidor FLOW |

O contrato não substitui IAM, OIDC, Firestore/SQL, KMS, Storage, auditoria ou
regras multiempresa. Também não transporta certificado, PFX, senha, chave
privada, XML assinado ou referência interna de armazenamento.

## 7. Testes executados

| Comando | Resultado |
| --- | --- |
| `npm run test:fiscal-contract` | 10/10 aprovados |
| `npm run test:fiscal-service` | 32/32 aprovados |
| `npm run test:security` com Java 21 somente na sessão | 82/82 aprovados: transporte 4, contrato 10, autorização/cofre 44, NFS-e 6, multiempresa 6 e regras 12 |
| `npm run typecheck` | aprovado |
| `npm run build` | aprovado; 80 páginas e rotas existentes preservadas |
| `git diff --check` | aprovado após finalizar código e documentação |

Os testes do contrato cobrem comando válido/inválido, IDs obrigatórios, versão,
campos extras, autorização autodeclarada recursiva, todos os vínculos de
confiança, identidade/grant expirados ou revogados, erros, estados sem emissão,
compatibilidade de major, round-trip JSON e isolamento de frameworks.

As mensagens `PERMISSION_DENIED` do emulador são casos negativos esperados; a
suíte terminou com código zero. O build exibiu somente o aviso preexistente de
base `caniuse-lite` desatualizada, sem atualização de dependência neste Gate.

## 8. Dependências remanescentes e riscos

- o novo contrato ainda não é consumido por FLOW, rotas ou serviço fiscal;
- Zod é a única dependência de runtime; futura distribuição entre repositórios
  exigirá pacote/versionamento ou geração de JSON Schema/OpenAPI revisada;
- o payload é propositalmente genérico neste Gate; schemas por operação devem
  ser definidos antes de integrar endpoint, sem transportar material sensível;
- verificação criptográfica OIDC, allowlist de issuer/audience/subject e clock
  skew permanecem no adaptador futuro;
- grant, nonce, idempotência, replay e reconciliação ainda não têm store
  distribuído produtivo;
- estados atuais do domínio NFS-e ainda não foram migrados/mapeados para o V1;
- a dependência cruzada do teste `services/fiscal-local` para
  `src/lib/nfse/domain.ts` permanece;
- não há OpenAPI, consumer-driven test entre repositórios ou teste E2E;
- aceitar qualquer versão `1.x` sem atualizar o parser seria incompatível; a
  negociação deve falhar fechada até os schemas serem atualizados;
- listas recursivas de chaves proibidas reduzem spoofing, mas schemas específicos
  por operação e limites de profundidade/tamanho ainda serão obrigatórios no
  adaptador HTTP.

## 9. Critérios de aceite deste Gate

- contrato sem imports de framework/infraestrutura;
- request, identidade e grant em fronteiras separadas;
- autorização autodeclarada rejeitada;
- empresa, subject, operação, grant e nonce vinculados;
- respostas/erros e serialização validados;
- nenhuma emissão concluída representável;
- testes e regressões aprovados;
- nenhum endpoint, regra, IAM, infraestrutura ou consumidor administrativo
  alterado;
- HTTP 503 e kill switch preservados.

## 10. Preparação para o Gate 2B.3

O Gate 2B.3 permanece **NÃO AUTORIZADO**. Antes dele, revisão humana deverá
decidir:

- ownership e forma de distribuição do contrato;
- schemas de payload por operação e limites de tamanho/profundidade;
- endpoint/OpenAPI e headers de versão/idempotência/correlação;
- allowlist e parâmetros OIDC;
- semântica do grant e seu emissor confiável;
- store atômico para nonce/idempotência e política de replay;
- mapeamento de estados existentes e compatibilidade N/N-1;
- testes consumer/provider e estratégia de rollout/rollback mantendo 503.

Este relatório e o código local não autorizam, isoladamente, criação de repositório,
migração, endpoint novo, deploy, certificado real, transmissão fiscal, recurso
Google Cloud ou início automático do Gate 2B.3.
