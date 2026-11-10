# Sprint 3.2H — inventário e preparação controlada da infraestrutura fiscal

## Escopo, método e evidência

Inventário documental realizado em 10 de novembro de 2026, na branch
`feature/nfse-multiempresa-fase1`, commit de referência `e4a4706`, com árvore
inicialmente limpa. Não houve acesso ao Console, APIs ou CLI do Google Cloud.
Nenhum recurso foi consultado remotamente, criado ou alterado.

Classificação usada:

- **CONFIRMADO NO REPOSITÓRIO:** reproduzível a partir de arquivo versionado;
- **HISTÓRICO — A CONFIRMAR:** registrado em Sprint anterior, sem validação atual;
- **NÃO VERIFICADO:** não há evidência local suficiente e nada é presumido.

## 1. Inventário da infraestrutura

| Recurso/configuração | Estado | Evidência | Lacuna/risco | Próxima verificação autorizada |
| --- | --- | --- | --- | --- |
| Firebase App Hosting | **HISTÓRICO — A CONFIRMAR:** backend em `us-central1`, deploy por `main` | plano 3.2G; `apphosting.yaml` comprova apenas configuração declarativa | backend, projeto, região, branch e revisão atuais podem ter mudado | exportação/captura somente leitura do backend, após autorização |
| App Hosting runConfig | **CONFIRMADO NO REPOSITÓRIO:** `maxInstances: 1`, `timeoutSeconds: 300` | `apphosting.yaml` | configuração efetiva pode divergir; CPU, memória e concorrência ausentes | comparar arquivo com revisão implantada, sem alterar |
| Runtime Node.js | **NÃO VERIFICADO** no deploy | `package.json` não fixa `engines.node`; `@types/node` 20 não define runtime | diferenças criptográficas/runtime | consultar build/revisão do App Hosting e depois fixar por decisão |
| Cloud Run atual | **HISTÓRICO — A CONFIRMAR:** serviço gerenciado pelo App Hosting | plano 3.2G | nome, revisão, ingress, escala e região não verificados | listar serviços/revisões em modo somente leitura |
| Cloud Run fiscal | **NÃO VERIFICADO:** nenhum recurso local prova provisionamento | protótipo apenas em `services/fiscal-local` | não é possível afirmar existência ou configuração atual; não há fronteira privada produtiva comprovada | futuro recurso novo, somente após gate humano |
| SA do App Hosting | **HISTÓRICO — A CONFIRMAR** | plano 3.2G registra identidade anteriormente identificada, sem valor | principal e escopo atuais desconhecidos | consultar identidade de execução e bindings efetivos |
| SA fiscal exclusiva | **NÃO VERIFICADO** | nenhuma configuração local | ausência de isolamento e privilégio mínimo | planejar criação futura, sem chave JSON |
| IAM | **NÃO VERIFICADO** | nenhum export IAM versionado | principal público, papéis básicos ou excesso de privilégio podem existir | obter policy e IAM recommender somente leitura |
| Cloud Storage fiscal | **HISTÓRICO — A CONFIRMAR:** nenhum bucket fiscal havia sido identificado | plano 3.2G | não comprova ausência atual; região/retention desconhecidos | inventariar buckets e políticas somente leitura |
| Cloud KMS | **HISTÓRICO — A CONFIRMAR:** API não estava ativada | plano 3.2G | estado atual, key rings e IAM desconhecidos | verificar APIs/key rings sem ativar nada |
| Secret Manager | **HISTÓRICO — A CONFIRMAR:** existia sem segredo fiscal | plano 3.2G; `apphosting.yaml` referencia apenas `GEMINI_API_KEY` | não inspecionar valores; IAM/versões não verificados | listar somente metadados e bindings autorizados |
| Firestore | **CONFIRMADO NO REPOSITÓRIO:** regras, índices e emulador local configurados | `firebase.json`, `firestore.rules`, `firestore.indexes.json` | projeto, localização, banco, PITR/backup e dados atuais não verificados | consultar metadados do banco; nunca ler dados sensíveis no inventário |
| Grants/nonces | **CONFIRMADO NO REPOSITÓRIO:** adaptadores em memória | `grant-store.ts`, `nonce-store.ts` | não duráveis nem multi-instância | datastore transacional futuro; TTL só para limpeza |
| Logging | **NÃO VERIFICADO** | contrato local de eventos sanitizados | sinks, retenção, exclusões, acesso e alertas desconhecidos | inventariar buckets/sinks/métricas sem mudar configuração |
| Data Access Audit Logs | **HISTÓRICO — A CONFIRMAR:** pendente | checklist 3.2G | acessos a KMS/Storage/Secret Manager podem não ser auditados | exportar audit config IAM somente leitura |
| Faturamento | **HISTÓRICO — A CONFIRMAR:** vinculado | plano 3.2G | conta e vínculo atuais desconhecidos | confirmar vínculo sem alterar billing |
| Orçamentos/alertas | **HISTÓRICO — A CONFIRMAR:** existiam orçamentos | plano 3.2G | escopo fiscal, valores e destinatários desconhecidos | listar budgets e notificações somente leitura |

Não há `.firebaserc` no conjunto inventariado. Portanto, o projeto efetivo não
pode ser inferido com segurança a partir do repositório.

## 2. Diferenças em relação à arquitetura 3.2G

| Capacidade proposta | Aproveitável hoje | Diferença a resolver |
| --- | --- | --- |
| Backend web App Hosting | arquitetura Next.js e configuração declarativa existentes | preservar; não migrar nesta etapa; reconfirmar identidade/região/runtime |
| Serviço fiscal privado | contratos e protótipo sintético reutilizáveis conceitualmente | Cloud Run fiscal não verificado; falta OIDC Google, imagem e pipeline |
| Grants/nonces distribuídos | interfaces e testes locais | escolher banco/região; implementar transação, expiração lógica, uso único e TTL de limpeza |
| Cofre A1 | contrato, autorização e testes sintéticos | Storage, KMS, metadados duráveis, rotação e DR ainda ausentes/não verificados |
| Auditoria | eventos locais com allowlist | Data Access, retenção, sinks, alertas e segregação ainda não verificados |
| Ambientes | bloqueio produtivo no código | projetos, SAs, chaves, buckets, bancos e pipelines separados não verificados |
| Emissão oficial | domínio e bloqueios HTTP 503 | PKCS#12/ICP-Brasil, XMLDSIG, mTLS, APIs e homologação permanecem pendentes |

Recursos existentes potencialmente reaproveitáveis: backend App Hosting, domínio
de autorização, contratos do serviço fiscal, Firestore como tecnologia já usada,
estrutura de testes e eventos sanitizados. “Reaproveitável” não significa que a
configuração implantada esteja aprovada para uso fiscal.

Recursos futuros: Cloud Run fiscal privado, SA fiscal exclusiva, persistência
distribuída, bucket fiscal privado, key ring/KEK, segredos operacionais, auditoria
Data Access, alertas fiscais e pipeline de artefato imutável. A lista é plano, não
autorização para criação.

## 3. Região e separação de ambientes

`southamerica-east1` permanece preferência inicial para o núcleo fiscal, não
decisão definitiva. A decisão deve comparar disponibilidade de Cloud Run,
Firestore, Storage, KMS e Secret Manager, localização das APIs oficiais, custo,
residência e latência em relação ao App Hosting historicamente em `us-central1`.

Preferência de segregação: projetos distintos para desenvolvimento, homologação
e produção, cada um com SA, bucket, key ring, banco/coleções, segredos, logs,
budgets e pipeline próprios. Desenvolvimento usa somente dados sintéticos.
Homologação só poderá usar certificado específico após aprovação. Produção
permanece sem upload e emissão até o gate 7.

## 4. Matriz IAM proposta

| Principal futuro | Recurso/escopo | Permissão mínima | Não deve possuir |
| --- | --- | --- | --- |
| SA App Hosting | Cloud Run fiscal específico | `roles/run.invoker` | Storage fiscal, KMS decrypt, segredos fiscais |
| SA Cloud Run fiscal | objeto autorizado no bucket do ambiente | papel customizado com `storage.objects.get` | listar buckets, IAM, acesso cruzado |
| SA Cloud Run fiscal | KEK do ambiente | `cloudkms.cryptoKeyVersions.useToDecrypt` | administrar, rotacionar ou destruir chaves |
| SA Cloud Run fiscal | segredos operacionais específicos | `secretmanager.versions.access` | listar/administrar todos os segredos |
| SA Cloud Run fiscal | registros fiscais necessários | operações Firestore mínimas | coleções não fiscais e administração do banco |
| SA ingestão administrativa | bucket/metadados do ambiente | criar nova versão cifrada após dupla autorização | invocar emissão, administrar KMS/IAM |
| SA pipeline | serviço e Artifact Registry aprovados | publicar imagem, implantar revisão, `actAs` restrito | decrypt, PFX, dados fiscais, alterar IAM |
| administrador KMS | key ring do ambiente | administrar ciclo da KEK | ler objetos ou executar fluxo fiscal |
| auditor | views/log buckets | leitura de auditoria | invocação, Storage, KMS ou segredos |

Proibir `Owner`, `Editor`, chaves JSON, `allUsers` e `allAuthenticatedUsers` na
fronteira fiscal. Toda concessão futura exige teste positivo e negativo.

## 5. Persistência, criptografia, auditoria e DR

- Firestore transacional é a opção inicial para grants, nonces, estados e
  idempotência, sujeita à decisão de localização e isolamento. A expiração deve
  ser validada em cada operação; TTL não substitui verificação nem consumo
  atômico, apenas remove documentos posteriormente.
- Certificado e senha ficam em envelope AES-256-GCM com DEK aleatória por versão,
  AAD de ambiente/empresa/credencial/versão e DEK cifrada pela KEK KMS. Metadados
  ficam separados do ciphertext. KMS protege o armazenamento, não substitui a
  chave privada ICP-Brasil contida no A1.
- Cloud Run abre material apenas em memória, com limites, timeouts e descarte.
  Nada em `/tmp`, logs, traces ou respostas.
- Auditoria combina eventos de aplicação, Admin Activity e Data Access para
  Cloud Run, Firestore, Storage, KMS e Secret Manager, com correlation ID,
  retenção aprovada e acesso separado.
- DR exige RPO/RTO humanos, versionamento/lifecycle, backup de metadados,
  preservação das versões KEK necessárias, restauração com envelopes sintéticos,
  reconciliação e runbook. Backup sem KEK utilizável não é recuperação.

## 6. Custos e riscos

Mantêm-se as premissas preliminares da 3.2G: 100 operações por empresa/mês,
20 segundos por operação, 1 vCPU/1 GiB, concorrência 1, escala a zero, 20 MiB por
empresa e baixo volume de logs. Faixas incrementais: 10 empresas, US$ 0–2/mês;
50, US$ 1–8/mês; 200, US$ 5–25/mês. Uma instância mínima pode acrescentar cerca
de US$ 55–75/mês por ambiente. São estimativas, não orçamento aprovado.

Não estão incluídos câmbio, impostos, egress inter-região, builds/artefatos em
volume, backups extensos, CRL/OCSP pagos, APIs municipais, suporte ou incidentes.
Free tiers são compartilhados e não garantidos. Região, carga e retenção devem
ser aprovadas antes de recalcular no Pricing Calculator.

Riscos críticos: IAM excessivo, replay multi-instância, vazamento em logs/tmp,
parser PKCS#12/XML hostil, duplicidade de emissão, perda de versão KMS, latência
inter-região, retenção incorreta e deriva entre ambientes. Todos permanecem
abertos até os critérios de aceite dos sete gates serem demonstrados.

## 7. Roteiro de configuração futura — operações pequenas e reversíveis

Nenhuma operação abaixo foi executada. “Reversível” não dispensa aprovação nem
autoriza exclusão; toda reversão deve preservar auditoria e dados exigidos.

| # | Serviço/configuração | Pré-requisitos | Impacto e custo estimado | Risco | Verificação | Reversão | Autorização humana |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 0 | inventário read-only de projeto, App Hosting, Run, IAM, APIs, regiões e billing | acesso de leitura aprovado e identificador do projeto | nenhum impacto; custo desprezível | exposição acidental de metadados | export datado, revisado e sem valores secretos | descartar cópia conforme política | dono do projeto e segurança |
| 1 | decisão de ambientes e região | inventário 0, residência/latência/custo | só decisão; sem custo | escolha inadequada e retrabalho | ADR assinado | nova ADR antes de provisionar | arquitetura, segurança, jurídico e financeiro |
| 2 | baseline de IaC em revisão, sem aplicar | decisão 1, repositório/pipeline aprovados | nenhum recurso; custo zero | configuração insegura futura | plan/lint/policy checks sem apply | reverter PR | plataforma e segurança |
| 3 | projetos/pastas de homologação e produção | gate 1 aprovado, billing/budget definidos | custos administrativos/uso futuro | isolamento incompleto | IDs, labels, liens e billing revisados | remover vínculo/arquivar somente se vazios e aprovado | direção e billing admin |
| 4 | SAs fiscal, ingestão e pipeline sem chaves | projetos criados | sem custo direto | impersonation excessiva | listar SAs/chaves = nenhuma chave criada | desabilitar SA/bindings | IAM admin e segurança |
| 5 | Artifact Registry e pipeline de imagem | SAs, SBOM/SCA e proveniência definidos | baixo, conforme armazenamento/build | supply chain | imagem por digest, assinatura e promoção testadas | desabilitar pipeline/reter artefato auditável | plataforma |
| 6 | Cloud Run fiscal vazio/healthcheck privado | imagem sintética, SA fiscal, região | escala a zero: baixo; min instance aumenta custo | acesso público/DoS | chamada anônima negada; backend autorizado; audience/subject validados | zerar tráfego/desabilitar serviço | plataforma e segurança |
| 7 | Firestore fiscal/coleções de grant e nonce | região e modelo transacional aprovados | baixo por operação; TTL cobrado quando aplicável | replay/consistência | testes multi-instância, expiração lógica e falha fechada | desativar consumidor; reter registros conforme política | dados e segurança |
| 8 | key ring e KEK software de homologação | separação de funções e rotação aprovadas | cerca de US$ 0,06/versão ativa + operações | perda/uso indevido da KEK | IAM negativo, encrypt/decrypt sintético, rotação e restore | desabilitar versão só após prova de recuperação | custódios KMS e segurança |
| 9 | bucket fiscal de homologação | região, retenção/lifecycle e KEK aprovados | centavos em baixo volume | exposição/exclusão | PAP, UBLA, IAM negativo, versionamento e restore sintético | bloquear escrita; remoção futura sob política | dados, segurança e jurídico |
| 10 | Secret Manager operacional | inventário de segredos inevitáveis | baixo por versão/acesso | segredo amplo ou duplicação de PFX | acesso por SA/versão e auditoria | desabilitar versão após rotação | dono do segredo e segurança |
| 11 | Data Access, logs, métricas e alertas | taxonomia/redaction/retenção aprovadas | geralmente baixo; cresce com ingestão/retenção | log de material sensível/custo | eventos sanitizados, alertas e acesso do auditor | ajustar filtros/retenção sem apagar trilha exigida | segurança, auditoria e financeiro |
| 12 | cofre por envelope com dados sintéticos | operações 7–11 aceitas | custos KMS/Storage/Firestore | corrupção/falha parcial | round-trip, tamper, rotação, revogação, DR | desligar fluxo e restaurar snapshot sintético | segurança e produto |
| 13 | PKCS#12/ICP-Brasil sintético e adversarial | threat model, biblioteca/SBOM aprovados | compute de testes | RCE/DoS/algoritmo fraco | corpus, fuzz/limites, cadeia e descarte | remover feature flag/artefato | AppSec e fiscal |
| 14 | XMLDSIG/mTLS em sandbox | vetores oficiais e provedor definido | compute/rede e possível terceiro | assinatura inválida/replay | vetores, canonicalização, TLS e idempotência | kill switch e retirada de tráfego | fiscal, segurança e provedor |
| 15 | homologação controlada | gates 1–5 e runbooks aceitos | conforme volume/terceiros | efeito fiscal indevido | casos aprovados e reconciliação | kill switch, rollback e revogação | direção, fiscal, jurídico e segurança |
| 16 | produção | homologação e change record aprovados | orçamento formal obrigatório | impacto fiscal/financeiro | canário, SLO, plantão e reconciliação | rollback e kill switch testados | autorização executiva formal |

Dependência estrita: 0→1→2; infraestrutura/identidade (3–6) antecede persistência
e criptografia (7–12); estas antecedem PKCS#12 (13), XML/mTLS (14), homologação
(15) e produção (16). Nenhum gate pode ser inferido de teste sintético anterior.

## 8. Decisões dependentes de aprovação

- projeto(s), billing account, região e proprietários por ambiente;
- preservação do App Hosting atual e identidade chamadora;
- Firestore dedicado ou compartilhado, localização, consistência, RPO/RTO;
- KMS software ou HSM, rotação, destruição e custódia dupla;
- retenção, lifecycle, legal hold, backup e descarte;
- SLO, concorrência, escala máxima/mínima e orçamento;
- bibliotecas PKCS#12/XMLDSIG e SLA de vulnerabilidades;
- provedores/municípios, certificado de homologação e base legal/LGPD;
- responsáveis por IAM, auditoria, incidentes, rollback e liberação produtiva.

## 9. Segurança e bloqueios

Cloud Run fiscal privado, OIDC, IAM mínimo, grants e nonces distribuídos são
requisitos, não controles atuais confirmados. Nenhum A1 real pode ser usado.
Transmissão, upload e emissão permanecem bloqueados com HTTP 503. O kill switch
deve permanecer. O App Hosting existente não deve ser migrado nem modificado
nesta etapa.

## 10. Parecer sobre o primeiro recurso futuro

O primeiro passo autorizado deve ser **uma operação de inventário somente
leitura**, não a criação de recurso. Depois da aprovação desse inventário e da
ADR de ambientes/região, o primeiro artefato configurável deve ser o baseline de
IaC em modo plan/policy-check, ainda sem apply.

Se e somente se esses gates forem aprovados, o primeiro recurso cloud de menor
acoplamento recomendado é a **service account exclusiva do serviço fiscal, sem
chaves e inicialmente sem permissões de dados**. Ela estabelece identidade para
revisar os bindings antes de Cloud Run, Storage ou KMS. A criação continua
dependente de autorização explícita em Sprint futura.
