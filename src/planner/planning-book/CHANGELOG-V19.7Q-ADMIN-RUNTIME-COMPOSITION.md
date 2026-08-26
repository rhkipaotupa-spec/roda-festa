# V19.7Q — Admin Runtime Composition

Base obrigatória: `ff160acb678cd786bef02d9ec55bbe83eacfe4a4`.

## Objetivo

Compor, em uma factory server-side única, os adapters persistentes da V19.7P com o verifier, repository, autorização, autenticação e login já construídos.

## Cadeia composta

`Supabase admin_users`
→ `Identity Store`
→ `Credential Verifier`
→ `Supabase admin_sessions`
→ `Session Repository`
→ `Authorization Boundary`
→ `Authentication Composition`
→ `Login Composition`

## Propriedades

- configuração Supabase ausente falha alto já na criação do runtime;
- `fetch` server-side inválido falha alto;
- não existe fallback para o adapter Admin em memória;
- `SUPABASE_SERVICE_ROLE_KEY` não faz parte do objeto público do runtime;
- runtime público expõe apenas as composições necessárias;
- teste integrado comprova login ponta a ponta com adapters Supabase reais e transporte simulado;
- token bruto não entra no registro persistido.

## Deliberadamente não entregue

- ligação do handler padrão `api/admin-login.js` ao runtime;
- migration;
- criação das tabelas remotas;
- usuário/senha real;
- hash real de usuário;
- secrets versionados;
- `fetch` no frontend.

A próxima unidade pode ligar o endpoint ao runtime sob configuração fail-closed, ainda antes da criação de credenciais reais.
