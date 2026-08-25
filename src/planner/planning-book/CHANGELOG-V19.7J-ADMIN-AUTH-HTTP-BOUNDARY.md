# V19.7J — Admin Authentication HTTP Boundary

Base obrigatória: `16ad59fa34b1e877faec341b721b146af27e0c74`.

## Objetivo

Criar a superfície HTTP mínima e isolada de autenticação administrativa, sobre as fundações já consolidadas de Authentication Contract, Session Repository e Authorization Boundary.

## Entregue

- login HTTP server-side com `credentialVerifier` injetado;
- logout com revogação de sessão;
- refresh com rotação de token;
- proteção de Origin em todas as mutações;
- métodos restritos a POST;
- emissão e limpeza de cookie `rf_admin_session`;
- cookie HttpOnly, SameSite=Lax, Path=/admin e Secure em produção;
- role/capabilities ignoradas quando fornecidas pelo navegador;
- respostas sem token bruto, tokenHash ou credential;
- testes de regressão completos.

## Deliberadamente não entregue

- tela visual de login;
- usuário/senha real;
- secret no repositório;
- provedor real de identidade;
- endpoint Admin global de jornadas;
- banco remoto;
- migration.

A próxima unidade pode criar a primeira experiência visual de login/teste sobre esta fronteira sem abrir ainda dados administrativos globais.
