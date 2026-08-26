# V19.7S — Admin Persistence Schema Contract

Base obrigatória: `8e90d11ada723b8b745e92708d071a4c90e8dbd2`.

## Objetivo

Versionar o contrato SQL de `admin_users` e `admin_sessions` derivado dos adapters e testes já aprovados, sem executar nada remotamente.

## Entregue

- contrato SQL em `supabase/admin/001_admin_persistence_contract.sql`;
- `admin_users` com identificador normalizado e único;
- material de verificação separado em `credential_algorithm`, `credential_salt`, `credential_hash` e `credential_key_length`;
- ausência deliberada de senha bruta;
- `admin_sessions` com `token_hash` único e ausência de token bruto;
- constraints temporais e de versionamento;
- índices para lookup por identidade, token e sessão ativa;
- RLS habilitado;
- privilégios removidos de `anon` e `authenticated`;
- nenhuma policy aberta para clientes;
- testes estruturais do contrato SQL.

## Deliberadamente não entregue

- execução do SQL no Supabase;
- migration remota;
- tabela remota criada;
- usuário real;
- senha real;
- hash/salt real;
- secrets;
- alteração do runtime;
- ligação do formulário visual.

A próxima unidade poderá revisar a compatibilidade desse contrato com o ambiente Supabase real antes de qualquer execução remota.
