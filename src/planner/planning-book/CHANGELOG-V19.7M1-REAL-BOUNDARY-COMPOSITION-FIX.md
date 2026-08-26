# V19.7M1 — Real Boundary Composition Fix

Base obrigatória: `be1634d416f7ef58e7f49ed740bcd5cd317d5e79`.

## Motivo

A V19.7M foi validada com uma boundary de teste que aceitava o verifier como segundo argumento de `login()`. A boundary HTTP real, porém, recebe `credentialVerifier` em sua construção. A incompatibilidade foi identificada antes da criação do primeiro endpoint Admin real.

## Correção

- `createAdminLoginComposition()` passa a construir a HTTP Boundary com o verifier confiável;
- a interface real de `createAdminAuthHttpBoundary()` passa a ser respeitada;
- o request do navegador não participa da injeção de dependências;
- testes unitários foram ajustados ao contrato real;
- novo teste de integração usa verifier real + HTTP Boundary real + repository real + authentication composition real;
- o teste ponta a ponta comprova credencial → verifier → boundary → sessão → cookie;
- credencial incorreta não cria sessão;
- Origin continua sendo validado antes da autenticação.

## Deliberadamente não entregue

- usuário/senha real de produção;
- secret versionado;
- endpoint Admin novo;
- `fetch` no frontend;
- banco remoto;
- migration.

Depois desta correção, a próxima unidade pode voltar ao plano V19.7N de expor uma rota HTTP controlada.
