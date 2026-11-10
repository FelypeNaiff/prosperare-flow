# Sprint 3.2B — cofre criptográfico simulado

## Implementação desta Sprint

O contrato `FiscalCredentialVault` separa domínio e infraestrutura. A implementação `SimulatedFiscalCredentialVault` existe apenas para testes e desenvolvimento não produtivo, mantém blobs cifrados somente em memória e falha ao iniciar com `NODE_ENV=production`.

O simulador usa AES-256-GCM do `node:crypto`, IV aleatório de 96 bits por parte e chave efêmera por instância. A autenticação inclui AAD com empresa, credencial, versão e finalidade da parte, impedindo a troca de ciphertext entre contextos. Não é um substituto para KMS, não persiste dados e não aceita certificados reais. Toda lease de plaintext possui `dispose()`, que zera material e senha sintéticos após o uso; caminhos excepcionais também zeram buffers já abertos.

Não existe rota pública para recuperar material criptográfico. Upload e emissão continuam bloqueados com HTTP 503.

## Arquitetura futura no Google Cloud

- **Cloud KMS:** chave de criptografia de chaves, rotação programada, separação por ambiente e permissão de decrypt limitada à identidade do backend fiscal.
- **Armazenamento privado:** bucket sem acesso público, uniform bucket-level access, retenção e versionamento definidos, blobs cifrados com envelope encryption.
- **Secret Manager:** somente para segredos operacionais inevitáveis; acesso por versão e identidade de serviço, nunca pelo navegador.
- **IAM:** service account exclusiva, sem papéis básicos, com permissões mínimas para objeto, chave e segredo específicos.
- **Auditoria:** Cloud Audit Logs mais `fiscalAuditLogs`, sempre sem PFX, senha, chave, plaintext, ciphertext ou URLs assinadas.
- **Revogação e destruição:** revogar metadados imediatamente, impedir decrypt, destruir versões conforme retenção legal e registrar evidências da operação.

## Riscos e pendências

- Selecionar e avaliar biblioteca consolidada para PKCS#12 e validação ICP-Brasil.
- Definir cadeia de confiança, CRL/OCSP, limites de tamanho, timeouts e proteção contra entradas malformadas.
- Projetar KMS, bucket, Secret Manager e IAM em projeto de homologação antes de qualquer certificado real.
- Definir resposta a incidentes, recuperação, rotação, retenção e descarte verificável.
- O simulador não protege contra inspeção da memória do processo e não deve ser usado para homologação fiscal ou produção.
