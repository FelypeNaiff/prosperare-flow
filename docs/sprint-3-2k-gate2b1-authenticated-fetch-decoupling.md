# Sprint 3.2K / Gate 2B.1 — desacoplamento do transporte HTTP autenticado

## 1. Escopo e verificação inicial

Refatoração local destinada a retirar o transporte HTTP genérico do namespace
fiscal, sem alterar endpoints, contratos, autorização, regras, infraestrutura ou
comportamento dos consumidores.

Estado inicial confirmado em 11 de novembro de 2026:

- branch `feature/nfse-multiempresa-fase1`;
- HEAD `e5a0fd37bb81398ee80fc8cd1ee3aac1aa2955ad`;
- árvore limpa;
- documentos dos Gates 1 e 2A disponíveis.

Nenhum repositório ou recurso remoto foi criado. HTTP 503 de upload/emissão,
kill switch e bloqueio de produção permanecem inalterados.

## 2. Inventário dos consumidores

| Consumidor | Classificação | Uso | Resultado |
| --- | --- | --- | --- |
| `src/app/portal/ferias/page.tsx` | administrativo FLOW | GET/POST de dados de férias no portal | import migrado para helper genérico |
| `src/app/portal/rescisao/page.tsx` | administrativo FLOW | GET/POST de dados de rescisão no portal | import migrado para helper genérico |
| `src/app/(dashboard)/login-cliente/page.tsx` | administrativo FLOW | criar, editar, bloquear e excluir logins | import migrado para helper genérico |
| `src/app/(dashboard)/equipe/permissoes/page.tsx` | administrativo FLOW, apesar de conter permissões fiscais | perfis e vínculos de acesso | import migrado para helper genérico |
| `src/components/nfse/EmissaoNfseModal.tsx` | específico NFS-e | chama a fachada `/api/nfse/emitir` | usa transporte genérico; domínio continua fiscal |
| `src/lib/fiscal/client.ts` | compartilhado na fronteira | DTOs e operações de empresas/metadados fiscais | mantém funções fiscais, delega transporte ao helper genérico |

Não foram encontrados outros consumidores. O nome anterior
`authenticatedFiscalFetch` não possui referência residual após a migração.

## 3. Arquitetura anterior e posterior

Antes:

```text
UI administrativa + UI NFS-e
        -> src/lib/fiscal/client.ts
             -> authenticatedFiscalFetch + DTOs/operações fiscais
```

Depois:

```text
UI administrativa --------------------+
UI NFS-e ------------------------------+-> src/lib/http/authenticated-fetch.ts
src/lib/fiscal/client.ts (DTOs fiscal) +       -> Firebase getIdToken + fetch
```

O novo `authenticatedFetch` continua recebendo `firebase/auth.User`, chamando
`getIdToken()`, construindo `Headers` a partir de `RequestInit.headers`,
sobrescrevendo `Authorization` com `Bearer <token>` e delegando ao `fetch` sem
reinterpretar a resposta ou o erro. Método, body, headers adicionais, tipagem e
semântica de autenticação foram preservados.

O arquivo fiscal mantém apenas `fetchCertificateMetadata` e
`fetchAccessibleCompanies`, seus DTOs e mensagens de domínio. Não foi criada
comunicação com serviço externo nem dependência circular.

## 4. Compatibilidade e decisão sobre alias

Não foi mantido alias temporário para `authenticatedFiscalFetch` porque:

- todos os consumidores estavam no mesmo repositório e foram migrados na mesma
  alteração;
- busca integral confirmou ausência de referências residuais;
- o símbolo não é endpoint nem contrato público;
- manter o alias preservaria o acoplamento nominal que este Gate remove.

O comportamento de runtime é equivalente. Endpoints, payloads, respostas,
permissões e mensagens dos consumidores não foram modificados. Caso um
consumidor externo desconhecido seja identificado antes do commit, a alteração
deve ser interrompida e a necessidade de alias reavaliada; não há evidência
local dessa dependência.

## 5. Arquivos criados ou alterados

- criado `src/lib/http/authenticated-fetch.ts`;
- criado `src/lib/http/authenticated-fetch.test.ts`;
- alterado `src/lib/fiscal/client.ts`;
- alterados os cinco consumidores listados no inventário;
- alterado `package.json` para adicionar `test:authenticated-fetch` e incluí-lo
  no início de `test:security`;
- criado este relatório.

Não foram alterados Firestore rules/indexes, rotas API, autorização multiempresa,
grants, cofre, certificados, configuração Firebase/Google Cloud ou dependências.

## 6. Testes e validações

| Comando | Resultado |
| --- | --- |
| `npm run test:authenticated-fetch` | 4/4 aprovados |
| `npm run typecheck` | aprovado, sem erro |
| `npm run test:fiscal-service` | 32/32 aprovados |
| `npm run test:nfse` | 6/6 aprovados |
| `npm run test:multiempresa` | 6/6 aprovados |
| `npm run test:security` com Java 21 somente na sessão | 72/72 aprovados: transporte 4, autorização/cofre 44, NFS-e 6, multiempresa 6, regras 12 |
| `npm run build` | aprovado; 80 páginas geradas e rotas fiscais mantidas |
| `git diff --check` | aprovado após finalizar código e documentação |

Os testes do transporte comprovam:

- aquisição do Firebase ID token;
- preservação de método, body, `Content-Type` e header de correlação;
- substituição de `Authorization` fornecido pelo chamador pelo token confiável;
- ausência de request quando `getIdToken()` falha;
- propagação sem alteração de resposta HTTP 503 e falha de rede.

As regressões existentes confirmaram isolamento multiempresa, permissões,
grants/replay, regras Firestore, HTTP 503 e bloqueio do protótipo em produção.
As mensagens `PERMISSION_DENIED` do emulador ocorreram nos testes negativos
esperados; a suíte encerrou com código zero.

O build emitiu apenas aviso informativo de base `caniuse-lite` desatualizada,
sem impacto nesta refatoração e sem autorizar atualização de dependências.

## 7. Riscos remanescentes

- os testes cobrem o helper e regressões de domínio, mas não são testes E2E de
  navegador para cada ação administrativa;
- o helper permanece acoplado ao tipo `User` do Firebase, por ser a semântica
  existente que este Gate deve preservar;
- módulos administrativos ainda utilizam rotas cujo servidor importa
  autorização do namespace fiscal; a separação dessa autorização é etapa
  posterior e não deve ser feita junto desta refatoração;
- não existe serviço FISCAL remoto nem teste de OIDC nesta etapa;
- o warning de `caniuse-lite` deve ser tratado por manutenção separada.

## 8. Critérios para avançar ao Gate 2B.2

O Gate 2B.2 permanece não autorizado até:

- revisão humana deste diff e deste relatório;
- execução final de `git diff --check` e varredura de segredos;
- confirmação de que somente os arquivos listados foram alterados;
- confirmação de árvore sem artefatos locais indevidos;
- decisão explícita do escopo do 2B.2;
- preservação de HTTP 503, kill switch, regras, IAM, multiempresa e ausência de
  certificado real, deploy ou comunicação fiscal remota.

Parecer: a refatoração é segura para revisão porque move somente a função de
transporte, mantém a autenticação byte a byte em termos de comportamento
observável, migra todos os consumidores conhecidos e amplia a regressão. Não
autoriza, isoladamente, o Gate 2B.2, extração de repositório ou alteração de
produção.
