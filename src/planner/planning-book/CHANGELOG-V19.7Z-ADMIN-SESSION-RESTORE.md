# V19.7Z — Admin Session Restore

Base obrigatória: `ed2604a65802fbcfc7017130c6865aa7157a089b`.

## Objetivo

Fazer a superfície `/admin` reconhecer, após reload ou nova abertura, uma sessão administrativa já válida no cookie HttpOnly.

## Contrato

- novo endpoint read-only `GET /api/admin-session`;
- cookie continua HttpOnly e nunca é lido pelo JavaScript;
- o endpoint reaproveita `authenticationComposition.authenticate()`;
- sem sessão válida: `200 { ok: true, authenticated: false }`;
- sessão válida: resposta pública mínima com `authenticated`, `role` e `expiresAt`;
- não expor sessionId, userId, capabilities, token ou token hash;
- runtime indisponível: 503 neutro;
- frontend consulta o endpoint ao montar;
- só restaura o estado autenticado após confirmação server-side;
- sem `localStorage`, `sessionStorage` ou token no frontend.

## Limite de produto

Esta unidade restaura autenticação, mas ainda não cria o dashboard administrativo final. A página funcional de gestão de orçamentos será uma unidade posterior.
