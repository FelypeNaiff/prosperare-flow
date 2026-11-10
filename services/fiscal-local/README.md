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
- O nonce é de uso único. Empresa, finalidade e credencial são novamente
  validadas no serviço fiscal.
- Cabeçalhos com sinais de navegador são rejeitados. Isso é defesa adicional;
  em produção, a barreira real será Cloud Run privado sem `allUsers`.

O cache de nonce deste protótipo é local à instância e não é durável. A futura
implementação distribuída deve usar armazenamento atômico com TTL para impedir
replay entre instâncias e após reinicializações. A inicialização também falha
fechada quando o ambiente não é explicitamente `development` ou `test`.

## Futuro Cloud Run

O segredo HMAC sintético será removido. O backend obterá token OIDC para a URL
do serviço fiscal usando sua service account. O Cloud Run verificará assinatura,
emissor e audiência antes de entregar a requisição, e somente a service account
do App Hosting receberá `roles/run.invoker`. O serviço ainda validará grant,
empresa, finalidade, expiração e replay. Nenhum token vindo do navegador será
encaminhado como identidade de serviço.
