# V19.7T — Admin Persistence Materialization Guard

Base obrigatória: `6b0e38a4ee6bc538291fc8f20f8c02c61116d68d`.

## Objetivo

Criar uma barreira explícita entre o contrato SQL versionado e qualquer execução no Supabase real.

Esta unidade **não executa SQL remoto** e **não instala Supabase CLI**.

## Pré-condições antes da primeira materialização

1. Working tree limpa.
2. Checkpoint V19.7S fechado.
3. Contrato alvo: `supabase/admin/001_admin_persistence_contract.sql`.
4. Nenhum secret copiado para o repositório, documentação ou chat.
5. Confirmar se `admin_users` e `admin_sessions` já existem no projeto Supabase alvo.
6. Se alguma tabela já existir, **parar** antes de aplicar o contrato e comparar o schema existente.
7. Executar o contrato somente em uma sessão autenticada do Supabase Dashboard/SQL Editor ou outra via administrativa aprovada.
8. Nunca usar `anon` key para materialização.
9. Nunca colar `SUPABASE_SERVICE_ROLE_KEY`, senha do banco ou connection string em arquivos versionados.

## Ordem controlada

### A. Preflight
Executar somente a primeira query de:
`supabase/admin/002_admin_materialization_guard.sql`

Esperado na primeira implantação:
- `admin_users = null`
- `admin_sessions = null`

Se qualquer valor não for `null`, **não aplicar 001** sem revisão.

### B. Materialização
Executar:
`supabase/admin/001_admin_persistence_contract.sql`

### C. Postflight
Executar as demais queries de:
`supabase/admin/002_admin_materialization_guard.sql`

Esperado:
- ambas as tabelas existem;
- RLS ligado nas duas;
- nenhuma policy criada;
- nenhuma grant para `anon`/`authenticated`;
- índices obrigatórios presentes.

## Ainda fora de escopo

- primeiro usuário Admin;
- senha real;
- hash/salt real;
- configuração de secrets;
- ligação do formulário visual;
- teste real de login.

A próxima unidade só deve provisionar a primeira identidade administrativa depois que essa materialização for comprovada e documentada.
