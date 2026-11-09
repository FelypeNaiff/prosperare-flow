# Sprint 2.1 — matriz de segurança Firestore

As regras são `deny-by-default`. Firebase Admin ignora Security Rules, portanto as APIs
devem validar token, status, empresa e operação antes de acessar dados.

| Coleção | Cliente | Funcionário | Administrador fiscal | Escrita direta |
|---|---|---|---|---|
| `users` | próprio documento | leitura para operação da equipe | leitura/gestão não sensível | perfil e `fiscalAdmin` imutáveis; transições via API |
| `accessProfiles` | negado | leitura | leitura | somente API auditada |
| `userCompanyAccess` | próprios vínculos | próprios vínculos | leitura | somente API auditada |
| `clients` | vínculo + `consultar` | vínculo + `view_clients` | todas | vínculo + permissão; criação administrativa |
| `clientAccesses` | negado | vínculo + `view_passwords` | todas | somente administrador fiscal |
| `tasks` | somente API do portal | vínculo + `view_tasks`/`manage_tasks` | todas | exige `canonicalClientId` |
| `processes`, `alvaras`, `certidoes`, `certifications` | negado | vínculo + módulo Processos | todas | exige identificador canônico |
| `contracts`, `receivables`, `installments` | negado | vínculo + Financeiro | todas | exige identificador canônico |
| `payables` | negado | negado | todas | somente administrador fiscal |
| `funcionarios` | somente API do portal | negado enquanto usar somente CNPJ legado | todas | somente administrador fiscal |
| `generated_documents` | negado | vínculo + Docs Flow | todas | exige identificador canônico |
| `notifications` | negado | apenas notificações do próprio UID | todas as próprias | criação pela equipe; atualização somente de `read` |
| `officeSettings` | leitura | leitura | leitura | permissão `configuracoes` |
| catálogos (`processoModelos`, `obligation_groups`, `irpf_stages`) | negado | permissão do módulo | todas | permissão de gestão específica |
| metadados fiscais | vínculo + `consultar` | vínculo + `consultar` | todos | somente backend |
| logs fiscais/administrativos | negado | negado | backend | somente backend |

## Incompatibilidades legadas negadas intencionalmente

- `funcionarios` usa `clientCnpj`, não `clientId`; o portal acessa por API autenticada.
- tarefas antigas com `clientId` contendo CNPJ não são liberadas diretamente; novas tarefas
  do portal recebem `canonicalClientId` e o histórico é servido pela API.
- `payables` não possui vínculo consistente com cliente e permanece administrativo.
- fluxos societários, análises fiscais e IRPF ainda não possuem identificador empresarial
  uniforme; permanecem administrativos até normalização.
- consultas globais da equipe a coleções empresariais precisam ser substituídas por consultas
  filtradas por `canonicalClientId` ou APIs paginadas. As regras não concedem acesso global para
  preservar compatibilidade.

## Compatibilidade transitória do portal

Clientes antigos com `cnpj`/`empresasVinculadas` em `users/{uid}` podem listar e usar o portal
em modo somente leitura por meio do backend. Essa compatibilidade não concede emissão,
cancelamento ou administração de credenciais e não cria/migra dados automaticamente.
