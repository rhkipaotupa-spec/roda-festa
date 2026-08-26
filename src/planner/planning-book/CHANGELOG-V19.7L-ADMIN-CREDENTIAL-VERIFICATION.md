# V19.7L — Admin Credential Verification Contract

Base obrigatória: `873d3bf5129f92f0bb8b9238871be9470f36c713`.

## Objetivo

Criar a camada server-side responsável por validar credenciais administrativas antes de conectar a tela `/admin` a um login real.

## Entregue

- hash de credencial com `scrypt`;
- salt criptográfico;
- comparação segura;
- lookup de identidade injetado e server-side;
- normalização somente do identificador;
- credencial tratada como case-sensitive;
- conta inativa rejeitada;
- resultado neutro para usuário inexistente e senha incorreta;
- role/capabilities derivadas exclusivamente do registro confiável;
- identidade autenticada não expõe hash, salt ou credencial;
- testes específicos de regressão.

## Deliberadamente não entregue

- usuário ou senha real;
- credencial em arquivo versionado;
- banco de usuários;
- endpoint HTTP novo;
- ligação do formulário visual ao backend;
- banco remoto;
- migration.

A próxima unidade poderá compor este verifier com a HTTP Boundary já criada, sem colocar secrets no frontend.
