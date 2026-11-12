# Sprint 3.2K — Gate 2B.3: preparação do isolamento fiscal

## 1. Escopo e evidência inicial

Diagnóstico local realizado na branch `feature/nfse-multiempresa-fase1`, a partir
do commit `321abef03dc32ccd5b2b9d74e936d62a845fde7e`, com árvore inicialmente limpa.
O Gate prepara uma fronteira de extração, mas não cria repositório, infraestrutura,
endpoint ou integração remota.

HTTP 503, kill switch, grants, isolamento multiempresa e ausência de transmissão
real permanecem requisitos obrigatórios. O Firebase App Hosting atual não é
alterado e o FLOW continua operando sem depender da disponibilidade fiscal.

## 2. Inventário de dependências

| Componente | Dependências observadas | Classificação | Destino futuro |
| --- | --- | --- | --- |
| `contracts/fiscal/v1.ts` | Zod | compartilhada por contrato | pacote/versionamento consumível por FLOW e FISCAL |
| `services/fiscal-local/contracts.ts` | Zod | independente, legado sintético | adaptar internamente; não publicar como segundo contrato wire |
| `isolated-fiscal-service.ts` | Node `crypto` e interfaces locais | independente | núcleo de aplicação do FISCAL, após substituição dos adaptadores sintéticos |
| `service-auth.ts` | Node `crypto`, Zod e contrato local | independente, somente sintético | substituir por verificador OIDC produtivo |
| `grant-store.ts` e `nonce-store.ts` | interfaces e memória local | independente, somente sintético | manter interfaces; criar stores distribuídos e atômicos |
| `http-server.ts` e `internal-client.ts` | Node HTTP/fetch e contrato local | independente | substituir/adaptar ao runtime privado e cliente FLOW |
| `audit-events.ts` | tipos do contrato local | independente | mapear para logging estruturado sem dados sensíveis |
| `src/lib/nfse/*` | domínio preliminar do FLOW | específica do FLOW nesta etapa | não importar pelo serviço; mapear estados por contrato aprovado |
| `src/lib/fiscal/server.ts` | Next server-only, Firebase Admin/Auth/Firestore | específica do FLOW | permanecer no FLOW/BFF; emitir contexto/grant confiável futuramente |
| demais `src/lib/fiscal/*` | modelos administrativos, Firebase Client ou cofre sintético | específica do FLOW | não migrar como implementação produtiva |
| teste fiscal anterior | importava `src/lib/nfse/domain.ts` e lia rota do FLOW | impeditiva para extração | dependência removida; bloqueios continuam nas suítes próprias do FLOW |

Não foram encontrados imports de React, Next, Firebase Client/Admin, Firestore ou
UI no runtime de `services/fiscal-local` nem no contrato V1.

## 3. Alterações realizadas

- criada `services/fiscal-local/v1-boundary.ts`, uma fronteira não conectada a
  endpoint para validar comando V1, contexto confiável e vínculos;
- criados testes locais da fronteira, executáveis sem inicializar FLOW, Next.js
  ou Firebase;
- removidos do teste fiscal o import de `src/lib/nfse/domain.ts` e a leitura da
  rota de upload do FLOW;
- ampliado `test:fiscal-service` para executar todos os testes locais do serviço;
- nenhuma rota, regra Firestore, autorização administrativa ou endpoint foi
  modificado.

A fronteira não está conectada ao servidor HTTP atual. Essa decisão evita alterar
o endpoint sintético existente; a integração exige rollout e aprovação posterior.

## 4. Limites de confiança e contrato V1

`networkCommand` é sempre não confiável. Identidade e grant são argumentos
separados e somente podem ser fornecidos por adaptadores confiáveis após:

1. verificação criptográfica OIDC, issuer, audience, subject e tempo;
2. leitura do grant em store controlado pelo backend;
3. verificação de revogação e expiração;
4. vínculo simultâneo de empresa, operação, subject, `grantId` e nonce;
5. consumo atômico posterior de nonce e idempotência em store distribuído.

A presença de identidade, grant, papéis ou permissões no JSON do cliente não
estabelece confiança e é rejeitada. A fronteira aceita somente
`VALIDATE_CREDENTIAL`; operações de preparação ou emissão retornam
`PRODUCTION_BLOCKED`. Não existe estado de emissão concluída.

## 5. Isolamento de falhas

O código do FLOW não importa a nova fronteira e nenhum módulo administrativo
passou a inicializar o serviço fiscal. Login, empresas, usuários, permissões e
processos mensais permanecem no mesmo grafo de dependências.

Os testes do serviço podem ser executados sem inicializar Next.js, Firebase ou o
aplicativo FLOW. O contrato V1 também não realiza I/O nem acessa recursos externos
durante a importação.

Limitação: este Gate comprova isolamento estático e testes unitários locais. Falha
de rede, timeout prolongado, circuit breaker e recuperação entre processos ou
repositórios exigem testes E2E após existir um cliente remoto aprovado.

## 6. Estrutura futura proposta para `prosperare-fiscal`

```text
prosperare-fiscal/
  src/
    application/       # casos de uso e orquestração
    contracts/v1/      # schemas portáveis publicados/versionados
    domain/             # estados e regras fiscais aprovadas
    adapters/
      auth/             # OIDC e allowlist de identidades
      grants/           # persistência confiável
      nonce/            # registro atômico distribuído
      idempotency/      # resultado e conflito por chave
      audit/            # eventos sanitizados
      vault/            # Storage + KMS, sem material em logs
    transport/http/     # Cloud Run privado, limites e erros
  test/
    contract/
    security/
    integration/
  docs/
  infra/                # somente após gate e aprovação específicos
```

## 7. Manifesto de extração

| Ordem | Item | Ação futura | Dependências | Teste/aceite | Rollback |
| --- | --- | --- | --- | --- | --- |
| 1 | contrato V1 e testes | publicar/copiar de modo versionado | ownership e release | consumer/provider iguais | FLOW mantém versão fixada anterior |
| 2 | interfaces de grant, nonce e auditoria | migrar interfaces, não memória como produção | contrato V1 | falha fechada e concorrência | protótipo permanece sem tráfego |
| 3 | fronteira V1 | migrar após revisão | pacote V1 | payload, vínculos e bloqueio real | fronteira não conectada |
| 4 | núcleo sintético | migrar/adaptar | interfaces anteriores | suíte independente aprovada | manter endpoint FLOW em 503 |
| 5 | adaptadores produtivos | implementar em gate próprio | OIDC, IAM e stores aprovados | integração sintética e auditoria | desativar tráfego fiscal |
| 6 | cliente FLOW | integrar por feature flag desligada | serviço privado e contrato | módulos administrativos independentes | remover flag/retornar ao 503 |
| 7 | homologação | tráfego controlado após autorizações | todos os gates | reconciliação e rollback | zero tráfego/503 |

Não devem migrar como implementação compartilhada: `src/lib/fiscal/server.ts`,
Firebase Client/Admin, UI, regras Firestore do FLOW, variáveis do App Hosting ou
cofre simulado tratado como solução produtiva.

Dependências mínimas iniciais: Node.js LTS, TypeScript e Zod. Bibliotecas de
PKCS#12, XMLDSIG e clientes externos só podem ser adicionadas após avaliação de
segurança, licença, manutenção e homologação.

## 8. Validações do Gate

| Validação | Resultado |
| --- | --- |
| contrato V1 | 10/10 aprovados |
| serviço fiscal e fronteira V1 | 37/37 aprovados: protótipo 31 e fronteira 6 |
| segurança | 82/82 aprovados, incluindo regras Firestore 12/12 com Java 21 somente na sessão |
| multiempresa | 6/6 aprovados também em execução isolada |
| typecheck | aprovado |
| build | aprovado, 80 páginas geradas |
| `git diff --check` e segredos | aprovados |

A contagem do serviço mudou de 32 para 37 da seguinte forma: os 32 anteriores
incluíam um teste estático que importava o domínio NFS-e e lia uma rota interna do
FLOW. Esse teste foi retirado intencionalmente da suíte que precisa funcionar fora
do repositório, deixando 31 testes do protótipo; seis testes independentes da
fronteira V1 elevaram o total a 37. Nenhum teste deixou de executar por alteração
acidental do glob. A emissão 503 continua coberta por `test:nfse`, e a rota de
upload 503 foi conferida diretamente e permaneceu sem alteração neste Gate.

## 9. Critérios para futura criação do repositório

- ownership, organização GitHub, proteção de branch e revisores aprovados;
- licença e política de publicação do contrato definidas;
- manifesto aprovado, sem copiar segredos ou histórico sensível;
- CI com testes de contrato, segurança, dependências e secret scanning;
- projetos Google Cloud e ambientes aprovados separadamente;
- Cloud Run privado, OIDC/IAM mínimo e identidades por ambiente definidos;
- stores distribuídos de grants, nonce e idempotência projetados;
- Storage/KMS/Secret Manager, Data Access, orçamento, região, backup e recuperação
  aprovados;
- feature flag, rollout, reconciliação e rollback aprovados;
- nenhum certificado real ou transmissão antes da homologação formal.

## 10. Riscos e pendências

- fronteira V1 ainda não integrada a endpoint;
- payloads específicos e mapeamento completo de estados pendentes;
- OIDC, IAM, grants, nonce e idempotência ainda sintéticos/não produtivos;
- limites HTTP, rate limiting, timeout, circuit breaker e quotas pendentes;
- OpenAPI/JSON Schema e testes entre repositórios pendentes;
- PKCS#12, ICP-Brasil, XMLDSIG, mTLS e APIs oficiais não implementados;
- KMS, Storage, Secret Manager, auditoria, DR e segregação ambiental dependem de
  gates e aprovações humanas;
- isolamento operacional completo depende de testes E2E futuros.

Este relatório não autoriza, isoladamente, criação de repositório, deploy, provisionamento,
certificado real, transmissão fiscal ou início automático da próxima etapa.
