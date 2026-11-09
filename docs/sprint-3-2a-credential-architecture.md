# Sprint 3.2A — arquitetura de credenciais fiscais

## Separação de dados

- `fiscalCredentialMetadata` contém somente metadados operacionais: empresa, titular, série, emissor, validade, status e referência opaca.
- O PFX cifrado deverá residir em bucket privado, sem URL pública, com acesso exclusivo da identidade do backend.
- A chave de envelope deverá ser protegida no Cloud KMS; a senha do PFX deverá ser recuperada do Secret Manager apenas durante uma operação server-side autorizada.
- Firestore, respostas HTTP, navegador e logs nunca recebem PFX, senha, chave privada ou referência interna de armazenamento.
- A integração real com bucket, KMS e Secret Manager não faz parte desta Sprint e não foi provisionada.

## Fluxo futuro

1. API autenticada valida usuário, vínculo, perfil interno e `administrarCredenciais`.
2. Backend inspeciona o certificado em memória e valida CNPJ, validade e revogação.
3. PFX é cifrado por envelope e enviado ao armazenamento privado.
4. Firestore recebe somente metadados e referência opaca.
5. Toda consulta, substituição, revogação e tentativa negada gera auditoria sem segredos.

## Operações e auditoria

- Leitura retorna somente a projeção pública de metadados.
- Upload permanece bloqueado com HTTP 503.
- Substituição e revogação exigirão transação e manterão histórico imutável.
- Administradores transversais precisam de perfil administrativo e `fiscalAdmin=true`; os demais usuários precisam de vínculo ativo e permissão explícita.

## Riscos pendentes

- Definir região, retenção, versionamento, rotação de chaves e política de destruição do bucket.
- Definir identidade de serviço de mínimo privilégio e segregação entre homologação e produção.
- Implementar validação criptográfica real, cadeia ICP-Brasil, revogação e limpeza garantida de buffers.
- Projetar recuperação, rotação da senha e resposta a incidentes antes de aceitar qualquer certificado real.
