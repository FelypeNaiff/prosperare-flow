# Relatório Técnico - Fase 2 da Migração (Autenticação, Sessão & RBAC)

Este documento descreve a conclusão da **Fase 2** do plano estratégico de migração do **CRM Trupe** (preparado para o futuro nome estratégico **NEEX - Sistema de Gestão de Vendas**) para Supabase PostgreSQL + Prisma.

---

## 🚀 Implementações Realizadas

### 1. Camada de Autenticação Supabase
*   Criação de `src/lib/supabase/auth.ts` contendo funções auxiliares para validação de sessões e sign-out seguro do lado do servidor.

### 2. Validação do PIN Exclusivamente no Servidor
*   Criação de Server Actions em `src/lib/auth/actions.ts`:
    *   `validateProfilePin(userId, pin)`: Valida o PIN de 4 dígitos usando o hash `bcrypt` gravado no PostgreSQL e cria um cookie de sessão seguro (`httpOnly`, `secure`, `sameSite: lax`).
    *   `logoutProfileSession()`: Remove com segurança o cookie de sessão do servidor ao realizar logoff.
    *   `getAvailableProfiles()`: Recupera de forma dinâmica os operadores disponíveis no banco de dados através do Prisma.
*   Refatoração da página de seleção de perfis (`src/app/selecionar-perfil/page.tsx`) para:
    *   Substituir consultas diretas do Firestore pelo Prisma.
    *   Remover a checagem client-side de PIN, eliminando vazamento de hashes no navegador.

### 3. Middleware de Proteção e RBAC Server-Side
*   Criação de `src/middleware.ts` no diretório principal do Next.js para interceptar e analisar todas as requisições para rotas do sistema.
*   Validação em tempo real dos direitos de acesso a partir do cookie de sessão:
    *   **Bypass Administrativo:** Contas com `isAdmin: true` no banco Postgres acessam livremente qualquer módulo.
    *   **Matriz de Permissões Real:** Para usuários com perfil comum (Caixa/Vendedor), valida no nível da requisição se a permissão para o módulo correspondente está ativa no dicionário de permissões.

### 4. Remoção do Bypass Inseguro (Segurança Aprimorada)
*   Refatoração do hook `src/hooks/use-permissions.tsx` para eliminar completamente as validações inseguras hardcoded por strings de nome (`"FELYPE"`, `"MILENA"`) ou email.
*   Agora, as checagens do lado do cliente usam diretamente a propriedade `isAdmin` e o mapeamento de permissões carregado a partir do banco PostgreSQL relacional no fluxo de login.

### 5. Configuração do Módulo de Relatórios e Proteção Específica
*   Adicionado o módulo **Relatórios** (`/relatorios`) à matriz de proteção de rotas do middleware e do hook client-side.
*   Inclusão do item correspondente no menu lateral (`src/components/layout/app-sidebar.tsx`) protegido por regras dinâmicas de acesso.

---

## 🔒 Tabela de Proteção de Rotas Atualizada

A tabela abaixo resume como as rotas foram protegidas e quais permissões dinâmicas são necessárias (para usuários não-administradores):

| Rota / Módulo | Módulo / Permissão (Banco PostgreSQL) | Ação Requerida | Comportamento para Vendedor / Caixa |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Livre para todos logados | N/A | Acesso liberado ao painel básico |
| `/produtos` | `Produtos` | `visualizar` | Liberado para ver estoque/preço, mas sem edição |
| `/clientes`, `/filhos`, `/aniversariantes` | `Clientes` ou `Filhos` | `visualizar` | Acesso de leitura liberado |
| `/campanhas-whatsapp` | `CRM` | `visualizar` | Acesso apenas se explicitamente permitido |
| `/vendas`, `/pdv` | `Vendas` ou `PDV` | `visualizar` | Liberado para operação diária de caixa |
| `/financeiro`, `/carteira-saldos` | `Financeiro` | `acessar` | **Bloqueado por padrão** (sem acesso) |
| `/relatorios` | `Relatórios` | `visualizar` | **Bloqueado por padrão** (só acessa se tiver flag ativa) |
| `/configuracoes` (geral / usuários) | `Usuários`, `Permissões`, etc. | `visualizar` | **Bloqueado por padrão** (sem acesso) |

---

## ⚠️ Observações & Próximos Passos

1.  **Sincronização de Sessão (Firebase vs. Supabase):**
    *   Como o Firebase Auth ainda é mantido para o login inicial via Google, o fluxo depende de o usuário estar autenticado no Google (Firebase) antes de escolher o perfil (Supabase / Postgres).
    *   Ao realizar logout, o sistema chama `logoutProfileSession()` para garantir que tanto o cookie do servidor quanto a sessão cliente do Firebase sejam invalidados.
2.  **Migração de Dados Operacionais:**
    *   Os dados de Clientes, Vendas, Produtos e Financeiro continuam residindo no Firebase NoSQL. A Fase 3 iniciará o processo de migração dessas tabelas/coleções e suas respectivas regras de escrita.
