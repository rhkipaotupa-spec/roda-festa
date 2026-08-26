# V19.7R — Admin Login Runtime Wiring

Base obrigatória: `fcd6816cf6fe7c077a0bd68bcf066c452980d0bb`.

## Objetivo

Ligar o endpoint server-side `api/admin-login.js` ao `createAdminRuntime()` persistente consolidado na V19.7Q.

## Entregue

- handler padrão deixa de ser um `503` fixo e passa a usar o runtime real;
- criação do runtime ocorre no servidor e recebe `process.env` + `globalThis.fetch`;
- falha de configuração/runtime é convertida para `503 admin_login_runtime_unavailable`;
- mensagens internas, stack e secrets não são devolvidos;
- runtime inválido também falha fechado;
- login válido continua atravessando o HTTP handler existente e preservando `Set-Cookie`;
- nenhuma autenticação em memória é introduzida.

## Deliberadamente não entregue

- migration;
- criação das tabelas `admin_users` / `admin_sessions`;
- usuário real;
- senha real;
- hash real de usuário;
- secrets versionados;
- ligação do formulário visual ao endpoint.

A infraestrutura HTTP está agora ligada ao runtime real, mas permanecerá indisponível operacionalmente enquanto a persistência Admin não estiver materializada/configurada.
