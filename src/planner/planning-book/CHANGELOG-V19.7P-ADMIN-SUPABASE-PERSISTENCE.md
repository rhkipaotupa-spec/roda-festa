# V19.7P — Admin Supabase Persistence Adapters

Base obrigatória: `9e1a2ef235906201958db4095a528546bff6ebfb`.

## Objetivo

Criar os adapters server-side de persistência Admin necessários para que identidades e sessões deixem de depender de memória de processo antes da composição do runtime real.

## Entregue

- `createSupabaseAdminIdentityStore()`;
- lookup de `admin_users` por identificador normalizado;
- mapeamento para o contrato esperado pelo `createAdminCredentialVerifier()`;
- `createSupabaseAdminSessionAdapter()`;
- persistência de `admin_sessions`;
- suporte a criação, resolução por token hash, revogação e rotação;
- somente `tokenHash` é persistido; token bruto permanece fora do storage;
- `SUPABASE_SERVICE_ROLE_KEY` é usada exclusivamente server-side;
- configuração ausente falha alto;
- erros remotos não devolvem corpo upstream nem secret;
- testes com fetch simulado, sem chamadas remotas reais.

## Contrato de tabelas esperado futuramente

`admin_users`:
- `id`
- `identifier`
- `role`
- `capabilities`
- `active`
- `credential_algorithm`
- `credential_salt`
- `credential_hash`
- `credential_key_length`
- `metadata`

`admin_sessions`:
- `id`
- `user_id`
- `role`
- `capabilities`
- `token_hash`
- `issued_at`
- `expires_at`
- `revoked_at`
- `rotated_at`
- `metadata`
- `version`

## Deliberadamente não entregue

- migration;
- criação das tabelas remotas;
- usuário/senha real;
- hash real de usuário;
- secrets;
- wiring do runtime;
- ativação do endpoint;
- `fetch` no frontend.

A próxima unidade pode compor estes adapters em um runtime Admin fail-high/fail-closed sem ainda criar credenciais reais.
