# Serviço fiscal isolado — protótipo local

Protótipo exclusivamente sintético para demonstrar a futura fronteira privada
entre o backend Prosperare Flow e um serviço Cloud Run fiscal. Não processa PFX,
não recupera certificados, não transmite NFS-e e falha ao iniciar em produção.

## Fronteira de confiança

- O backend autentica o usuário e cria um grant interno a partir do vínculo e
  das permissões persistidas; o navegador não cria nem assina grants.
- O token sintético prova apenas a identidade do serviço, audiência, finalidade,
  grant e nonce. O serviço fiscal resolve o grant em uma fonte confiável e não
  aceita `uid`, perfil ou permissões do corpo da solicitação.
- O contrato `ServiceIdentityVerifier` separa o domínio da implementação de
  autenticação. O adaptador atual usa somente tokens HMAC sintéticos.
- O nonce é registrado atomicamente uma única vez por `NonceStore`, com TTL.
  Empresa, finalidade e credencial são novamente validadas no serviço fiscal.
- Grants são emitidos apenas pelo método explícito do componente local
  confiável. Cada grant é vinculado a empresa, ator, perfil, permissão, subject,
  nonce e validade, e pode ser revogado.
- Cabeçalhos com sinais de navegador são rejeitados. Isso é defesa adicional;
  em produção, a barreira real será Cloud Run privado sem `allUsers`.

Os adaptadores de nonce e grant deste protótipo são locais à instância e não são
duráveis. O registro de nonce é atômico apenas dentro do processo Node. A futura
implementação distribuída deve usar armazenamento compartilhado, operação
condicional e TTL para impedir replay entre instâncias e após reinicializações.
A inicialização falha fechada quando o ambiente não é explicitamente
`development` ou `test`.

## Auditoria sintética

Eventos estruturados distinguem autenticação permitida/negada, grant válido,
expirado ou revogado, divergência de empresa, replay, falha de infraestrutura e
operação autorizada. Tokens, segredos e nonce bruto não fazem parte do contrato;
replay usa somente fingerprint SHA-256 truncada.

## Futuro Cloud Run

O adaptador HMAC sintético será substituído por um `ServiceIdentityVerifier`
OIDC que valide assinatura pelas chaves públicas do Google, issuer, audience,
subject e expiração. O backend obterá token OIDC para a URL do serviço fiscal
usando sua service account. O Cloud Run será privado e somente a service account
do App Hosting receberá `roles/run.invoker`. O serviço continuará validando
grant, empresa, finalidade, expiração e replay. Nenhum token vindo do navegador
será encaminhado como identidade de serviço.
