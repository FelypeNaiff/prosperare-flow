---
description: Start Flow - Comita código e envia para a branch main (Deploy automático pelo Firebase App Hosting)
---

**Contexto:** O usuário utiliza a palavra-chave "Start Flow" para solicitar o deploy oficial da aplicação. A aplicação utiliza o Firebase App Hosting, portanto, ao enviar (push) as alterações para a branch `main` do GitHub, o Google cuidará automaticamente do deploy.

// turbo-all

Para executar o "Start Flow", siga os passos sequencialmente utilizando a ferramenta `run_command`:

1. Verifique os arquivos que foram modificados.
   `git status`

2. Adicione todos os arquivos modificados.
   `git add .`

3. Faça um commit detalhando as alterações. Sugira uma mensagem baseada no contexto do trabalho realizado.
   `git commit -m "feat/fix: [insira aqui o resumo claro das alterações usando a língua principal do projeto]"`

4. Envie as atualizações para a branch main do repositório remoto. Isto acionará o seu deploy via Firebase App Hosting.
   `git push origin main`

5. (Opcional) Notifique o usuário sobre o envio usando uma mensagem amigável indicando que agora o Google Firebase App Hosting assumirá a publicação.
