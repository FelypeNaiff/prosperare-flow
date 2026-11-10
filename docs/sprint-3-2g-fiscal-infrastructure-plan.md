# Sprint 3.2G — planejamento definitivo da infraestrutura fiscal

## Escopo e status

Documento de decisão para aprovação. Nenhum recurso Google Cloud foi consultado,
ativado ou alterado nesta Sprint. As informações de console abaixo são evidências
históricas e precisam ser reconfirmadas antes do provisionamento.

## Diagnóstico em 10 de novembro de 2026

| Item | Estado confirmado no repositório | Limite da evidência |
| --- | --- | --- |
| Git | branch `feature/nfse-multiempresa-fase1`, HEAD `6ddffbc`, árvore inicialmente limpa | não informa estado do ambiente remoto |
| Next.js | 15.5.9, Node types 20; backend web concentra rotas e regras de negócio | versão efetiva do runtime do App Hosting não está fixada no repositório |
| App Hosting | `apphosting.yaml` define `maxInstances: 1`, timeout de 300 s e referência ao segredo `GEMINI_API_KEY` | CPU, memória, concorrência, região, SA e branch de deploy não estão no arquivo |
| Firebase | regras e índices Firestore configurados; emulador local na porta 8088 | projeto efetivo não está declarado em `.firebaserc` |
| Serviço fiscal | fronteira local isolada, contratos estritos, falha fechada e bloqueio fora de desenvolvimento/teste | não é um deploy Cloud Run nem processa material real |
| Identidade | contrato desacoplado; token HMAC somente sintético valida issuer, audience, subject, tempo e finalidade | verificador OIDC Google ainda não existe |
| Grants | escopo por empresa, ator, perfil, permissão, subject, nonce, expiração e revogação | store em memória, não durável nem multi-instância |
| Nonces | criação única atômica e TTL dentro de um processo Node | não impede replay entre instâncias/reinícios |
| Cofre | AES-256-GCM sintético em memória, AAD, descarte de buffers e bloqueio em produção | chave mestra efêmera; não usa Storage/KMS |
| Upload/emissão | permanecem bloqueados por HTTP 503 | nenhum fluxo real está autorizado |

### Evidência histórica do Google Cloud — a confirmar

- App Hosting observado em `us-central1`, deploy automático restrito a `main`;
- Cloud Run observado como recurso gerenciado pelo App Hosting e identidade de
  execução do App Hosting identificada;
- CPU, memória, concorrência e escala foram inventariadas anteriormente, mas não
  estão reproduzidas como configuração verificável neste repositório;
- nenhum bucket fiscal identificado; Cloud KMS não estava ativado;
- Secret Manager existia sem segredo fiscal;
- Data Access Audit Logs permaneciam pendentes;
- faturamento estava vinculado e havia orçamentos.

Cada afirmação precisa de captura/exportação atual do Console, data, projeto,
região e responsável antes de ser usada como premissa de implantação.

### Ressalvas mandatórias

- O TTL do Firestore serve para limpeza assíncrona e **não substitui** a
  verificação de expiração em cada solicitação nem a operação atômica de consumo
  único de grants, nonces e chaves de idempotência.
- O Cloud KMS protege a criptografia de armazenamento e o unwrap da DEK; ele
  **não substitui automaticamente a chave privada ICP-Brasil** contida no A1,
  nem transforma essa chave em uma chave KMS não exportável.
- `southamerica-east1` é uma **preferência inicial**, não uma decisão definitiva.
  A escolha depende de disponibilidade, residência, latência, custo e localização
  dos serviços persistentes e das integrações oficiais.
- O Firebase App Hosting existente **não deve ser migrado nesta etapa**. A
  proposta adiciona uma fronteira fiscal privada e preserva o backend web atual.
- Todos os custos deste documento são **estimativas**, não orçamento aprovado,
  cotação contratual ou autorização de consumo.

## Arquitetura proposta

```text
Navegador
   |
   | sessão do usuário (nunca identidade de serviço)
   v
Next.js / Firebase App Hosting
   |  autorização de negócio + grant curto e de uso único
   |  token OIDC Google com audience exata
   v
Cloud Run fiscal privado (sem allUsers/allAuthenticatedUsers)
   |-- valida OIDC, grant, empresa, finalidade e nonce
   |-- lê metadados/grant/nonce no Firestore transacional
   |-- baixa somente o envelope autorizado do Storage
   |-- solicita unwrap da DEK ao KMS
   |-- abre PFX, assina XML e executa mTLS apenas em memória
   |-- zera buffers e grava auditoria sanitizada
   +--> API oficial de homologação/produção, por ambiente e kill switch

Storage privado: ciphertext + metadados criptográficos não secretos
Firestore: metadados, grants, nonces, estados e idempotência; nunca PFX/senha
KMS: KEK por ambiente; serviço fiscal recebe apenas decrypt necessário
Secret Manager: credenciais operacionais inevitáveis; não é cofre de PFX
Logging/Monitoring: auditoria, métricas, alertas e correlação sem material sensível
```

### Decisões propostas

1. Projetos GCP separados para desenvolvimento, homologação e produção. Se isso
   for inviável no início, no mínimo contas, buckets, key rings, bancos, segredos,
   logs e pipelines separados, com plano datado de segregação por projeto.
2. Cloud Run fiscal preferencialmente em `southamerica-east1`, sujeito a validação
   de disponibilidade de todos os serviços e decisão formal sobre a latência do
   App Hosting em `us-central1`. Essa preferência não é decisão definitiva. Não
   usar conector VPC sem requisito de rede comprovado.
3. Ingress privado/autenticado, sem principal público. Somente a SA chamadora do
   backend recebe `roles/run.invoker`; o serviço valida audience e subject também.
4. Escala inicial: `minInstances=0`, `maxInstances` conservador, concorrência 1
   para operações com chave privada, 1 vCPU, 1 GiB, timeout por etapa e limite
   global inferior ao timeout HTTP. Ajustar somente após teste de carga/memória.
5. Firestore transacional para grant e nonce: criação condicional, uso único,
   expiração lógica obrigatória e TTL apenas para limpeza posterior. O consumo do
   nonce e a transição do grant devem ser idempotentes e auditáveis.
6. Envelope encryption: DEK aleatória por versão de certificado, AES-256-GCM com
   AAD contendo ambiente, empresa, credencial e versão; DEK cifrada pela KEK KMS.
   PFX e senha são cifrados no mesmo envelope ou em partes autenticadas vinculadas.
7. Bucket sem acesso público, Uniform Bucket-Level Access, Public Access
   Prevention, versionamento e lifecycle aprovados. Nada de URL assinada.
8. O serviço fiscal recebe `storage.objects.get` apenas no prefixo/bucket do seu
   ambiente e `cloudkms.cryptoKeyVersions.useToDecrypt` somente na KEK necessária.
9. Material aberto nunca persiste em disco, `/tmp`, logs, traces ou dumps. Buffers
   devem ter vida mínima e descarte explícito; limites de tamanho e tempo mitigam
   entradas PKCS#12/XML hostis.
10. Produção permanece com kill switch e HTTP 503 até autorização formal.

## Serviços Google Cloud necessários

| Serviço | Finalidade | Estado |
| --- | --- | --- |
| Cloud Run | serviço fiscal privado | futuro, não provisionado |
| IAM e Service Account Credentials | invocação OIDC sem chave JSON | futuro |
| Artifact Registry/Cloud Build | imagem imutável, SBOM, proveniência e promoção | decisão de pipeline pendente |
| Firestore | grants, nonces, metadados e idempotência | uso atual do app não equivale ao desenho fiscal |
| Cloud Storage | envelopes cifrados | bucket fiscal não verificado |
| Cloud KMS | KEK e rotação | não ativado na evidência histórica |
| Secret Manager | segredos operacionais inevitáveis | sem segredo fiscal na evidência histórica |
| Cloud Logging/Audit Logs | trilha operacional e Data Access | Data Access pendente |
| Cloud Monitoring | SLO, métricas e alertas | configuração fiscal não verificada |
| Billing/Budgets | limites e alertas financeiros | histórico existente, cobertura a confirmar |

## Matriz IAM mínima proposta

| Principal | Escopo | Papéis/permissões | Proibições |
| --- | --- | --- | --- |
| SA do App Hosting | serviço Cloud Run fiscal específico | `roles/run.invoker` | KMS, bucket fiscal, segredos fiscais |
| SA do Cloud Run fiscal | bucket/prefixo do ambiente | papel customizado com `storage.objects.get`; escrita somente em fluxo administrativo separado | listar buckets, acesso cruzado, IAM |
| SA do Cloud Run fiscal | KEK do ambiente | `roles/cloudkms.cryptoKeyDecrypter` ou papel customizado só com decrypt | encrypt/admin/destruir chaves |
| SA do Cloud Run fiscal | segredos específicos | `roles/secretmanager.secretAccessor` por segredo | listar/administrar segredos |
| SA do Cloud Run fiscal | Firestore fiscal | papel customizado com operações estritamente necessárias | acesso a coleções não fiscais |
| Pipeline de implantação | serviço/repositório aprovados | deploy de nova revisão e `actAs` apenas na SA fiscal | ler PFX, decrypt KMS, alterar IAM |
| Administrador de chaves | key ring do ambiente | administração KMS sem uso criptográfico | acesso a ciphertext/PFX |
| Operador de credenciais | fluxo administrativo | grava envelope após autorização dupla | administrar KEK ou logs |
| Auditor | logs/views de auditoria | leitura imutável e alertas | invocar serviço, ler objetos/decrypt |

Papéis básicos (`Owner`, `Editor`, `Viewer`) e chaves JSON de service account são
incompatíveis com o desenho. Concessões devem ser condicionais quando viável e
revisadas periodicamente.

## Fluxos controlados

### Armazenamento

1. operador autorizado inicia solicitação; backend revalida vínculo e privilégio;
2. componente isolado valida tamanho/formato usando somente certificado sintético
   até a fase formal de homologação;
3. gera DEK e cifra PFX/senha com AES-GCM e AAD versionada;
4. cifra DEK com KEK KMS; grava envelope no Storage e metadados no Firestore;
5. confirma integridade, audita e invalida buffers; falha parcial é reconciliada;
6. versão anterior passa a substituída/revogada segundo política aprovada.

### Uso

1. backend autentica usuário e emite grant curto, específico e de uso único;
2. obtém OIDC para audience exata e chama Cloud Run privado;
3. fiscal valida identidade, grant, empresa e consome nonce atomicamente;
4. lê envelope, unwrap da DEK, decifra em memória, valida estado/validade/cadeia;
5. executa assinatura/mTLS permitido, descarta material e registra resultado;
6. resposta contém somente estado, protocolo e erros sanitizados.

## Plano de implementação e critérios de aceite

| Fase | Dependências | Critério de aceite para avançar |
| --- | --- | --- |
| 1. Infraestrutura e identidade | projeto/região/pipeline aprovados | inventário reconfirmado; Cloud Run privado; OIDC real; SA exclusiva; IAM testado por negação; sem chave JSON |
| 2. Armazenamento e criptografia | fase 1, política de retenção e RPO/RTO | envelope testado com dados sintéticos; bucket/KMS segregados; rotação, revogação, restauração e falhas parciais testadas |
| 3. PKCS#12 e ICP-Brasil | threat model e biblioteca aprovada | corpus sintético/adversarial; MAC, senha, CNPJ, cadeia, validade, algoritmos e CRL/OCSP; SCA/SBOM aprovados |
| 4. XMLDSIG e mTLS | layouts/provedores definidos | vetores oficiais; canonicalização/algoritmos; agente TLS; timeouts; descarte de chave; interoperabilidade em sandbox |
| 5. APIs oficiais | contratos municipais e credencial de homologação autorizada | adaptadores por provedor, idempotência, retries seguros, reconciliação, rate limit e erros sanitizados |
| 6. Homologação controlada | fases 1–5 e aprovação jurídica/segurança | projeto isolado, certificado próprio de homologação, casos assinados, observabilidade, DR e runbooks exercitados |
| 7. Produção autorizada | aceite formal e change management | aprovação humana registrada, kill switch testado, canário, rollback, plantão e remoção explícita do 503 somente no fluxo autorizado |

Nenhuma fase autoriza automaticamente a seguinte. Upload real só pode surgir na
fase 2 após aceite; emissão real somente após a fase 7.

## Estimativa preliminar de custos

Premissas: USD, preços públicos consultados em 10/11/2026, 100 operações por
empresa/mês, 20 s por operação, Cloud Run request-based com 1 vCPU/1 GiB,
concorrência 1 e escala a zero, 20 MiB de envelopes por empresa incluindo versões,
4 leituras e 3 escritas Firestore por operação, duas operações KMS por uso, até
seis versões de segredos e menos de 50 GiB/mês de logs. Free tiers são
compartilhados pela conta de faturamento e não são garantia. Os valores são
estimativas preliminares, não constituem orçamento aprovado nem autorização de
provisionamento ou gasto.

| Empresas | Operações/mês | Faixa mensal incremental estimada |
| ---: | ---: | ---: |
| 10 | 1.000 | US$ 0–2 |
| 50 | 5.000 | US$ 1–8 |
| 200 | 20.000 | US$ 5–25 |

As faixas incluem Cloud Run, KMS software, Storage, Firestore, Secret Manager e
observabilidade em baixo volume, com margem regional/operacional. Com uma
instância mínima 1 vCPU/1 GiB sempre aquecida, acrescentar aproximadamente
US$ 55–75/mês por ambiente antes de descontos. Não incluem impostos, câmbio,
egress entre regiões, Artifact Registry/Build significativo, backups extensos,
consulta CRL/OCSP paga, nem tarifas de provedores municipais/terceiros.

Referências públicas: Cloud Run cobra por CPU/memória e oferece free tier;
KMS software custa cerca de US$ 0,06 por versão ativa/mês e US$ 0,03/10 mil
operações; Secret Manager oferece seis versões gratuitas e cobra por versão e
acesso; Firestore cobra leituras, escritas, TTL, armazenamento e rede; Logging
inclui franquia mensal. Recalcular no Pricing Calculator após região e carga
serem aprovadas.

## Matriz de riscos

| Risco | Probabilidade/impacto | Mitigação e gate |
| --- | --- | --- |
| replay entre instâncias | alta/crítico sem store distribuído | transação condicional, TTL lógico, teste concorrente multi-instância |
| comprometimento da SA fiscal | média/crítico | IAM mínimo, sem chave, isolamento por ambiente, alertas e revogação ensaiada |
| vazamento em log/dump/tmp | média/crítico | allowlist de eventos, redaction, sem core dump, testes de ausência e descarte |
| parser PKCS#12/XML vulnerável | média/crítico | biblioteca mantida, pinning, SBOM/SCA, corpus adversarial e limites |
| indisponibilidade/latência inter-região | média/alto | benchmark, timeout, retry idempotente, escolha regional formal |
| rotação KMS tornar dados ilegíveis | baixa/crítico | manter versões necessárias, inventário, restore sintético e dual control |
| exclusão/retensão incorreta | média/alto | política legal, versionamento, lifecycle, hold e runbook aprovado |
| grant revogado ainda utilizável | baixa/crítico | leitura consistente/transacional, expiração curta, revogação testada |
| duplicidade de NFS-e | média/crítico | chave de idempotência, state machine, consulta/reconciliação antes de retry |
| dependência municipal instável | alta/alto | adaptador por provedor, circuit breaker, filas somente se semântica permitir |
| custo/log storm | média/médio | budgets, quotas, amostragem sem perder auditoria e alertas de volume |
| deriva entre ambientes | média/alto | IaC revisado, promoção de artefato imutável e policy checks |

## Decisões humanas pendentes

- projetos separados e responsáveis por cada ambiente;
- região fiscal e aceitação explícita do tráfego inter-região;
- RPO, RTO, retenção, versionamento, descarte e legal hold;
- KMS software versus HSM, rotação e custódia/separação de funções;
- datastore fiscal dedicado versus banco atual e sua localização;
- biblioteca PKCS#12/XMLDSIG e política de vulnerabilidades;
- municípios/provedores prioritários e credenciais de homologação;
- base legal/LGPD, mandato para uso do certificado e resposta a incidentes;
- SLO, `minInstances`, limites de custo e escala;
- responsáveis por aprovação dupla, auditoria, plantão, rollback e liberação.

## Parecer

É viável iniciar somente a fase de infraestrutura/identidade após reconfirmar o
inventário e aprovar as decisões humanas acima. Não é viável habilitar upload,
recuperação, assinatura, mTLS ou emissão. Os bloqueios HTTP 503 devem permanecer.
