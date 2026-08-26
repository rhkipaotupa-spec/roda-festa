# V19.7N — Admin Login HTTP Endpoint

Base obrigatória: `76c12605273d03addf3aa5282c290935870ee4cf`.

## Objetivo

Criar a primeira porta HTTP concreta para o login Admin, adaptando request/response do ambiente serverless à composição já comprovada na V19.7M1.

## Entregue

- `api/admin-login.js`;
- factory de handler que exige composição de login válida;
- adaptação de método, headers e body para o contrato da HTTP Boundary;
- transporte de `Set-Cookie`;
- respostas públicas controladas para método inválido, Origin bloqueado, credenciais ausentes e credenciais inválidas;
- erros internos inesperados não expõem mensagem, stack, token ou credencial;
- handler padrão permanece `503 admin_login_runtime_unavailable` enquanto o runtime real ainda não estiver composto;
- testes específicos do endpoint.

## Deliberadamente não entregue

- usuário/senha real;
- secrets;
- runtime de credenciais configurado;
- persistência Admin remota;
- ligação do `AdminLogin.jsx` via `fetch`;
- dashboard;
- migration.

A próxima unidade deverá fazer o wiring server-side do runtime sem embutir credenciais no Git. Só depois o frontend será conectado ao endpoint.
