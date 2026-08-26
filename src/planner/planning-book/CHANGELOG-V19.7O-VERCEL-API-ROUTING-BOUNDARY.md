# V19.7O — Vercel API Routing Boundary

Base obrigatória: `7747c475e7ae6a5f32ddcb7057beacee476f2094`.

## Motivo

A configuração anterior possuía somente um rewrite catch-all:

`/(.*) -> /index.html`

Com a criação de `api/admin-login.js`, a topologia de deploy passa a precisar preservar explicitamente o namespace `/api/*` antes do fallback da SPA.

## Entregue

- rewrite explícito `/api/(.*) -> /api/$1`;
- fallback SPA mantido depois da regra de API;
- nenhum `builds` ou `routes` legado adicionado;
- testes de regressão para ordem e isolamento das regras.

## Deliberadamente não entregue

- runtime real de credenciais;
- usuário/senha real;
- secrets;
- `fetch` no frontend;
- banco remoto;
- migration.

A próxima unidade pode retomar o wiring server-side do runtime real sobre uma topologia de deploy que preserva a API.
