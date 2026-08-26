-- V19.7T — Admin Persistence Materialization Guard
-- Read-only preflight/postflight helpers.
-- IMPORTANT: do not paste secrets into this file.
-- This file does not create or alter schema objects.

-- PRE-FLIGHT: confirm current existence.
select
  to_regclass('public.admin_users') as admin_users,
  to_regclass('public.admin_sessions') as admin_sessions;

-- POST-FLIGHT: confirm both tables exist after contract materialization.
select
  to_regclass('public.admin_users') is not null as admin_users_exists,
  to_regclass('public.admin_sessions') is not null as admin_sessions_exists;

-- POST-FLIGHT: confirm row-level security is enabled.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('admin_users', 'admin_sessions')
order by c.relname;

-- POST-FLIGHT: confirm no policies exist for these tables.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('admin_users', 'admin_sessions')
order by tablename, policyname;

-- POST-FLIGHT: inspect table grants. Expected:
-- no anon/authenticated privileges on admin_users/admin_sessions.
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('admin_users', 'admin_sessions')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- POST-FLIGHT: confirm required unique indexes exist.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'admin_users_identifier_uidx',
    'admin_sessions_token_hash_uidx',
    'admin_sessions_user_id_idx',
    'admin_sessions_active_lookup_idx'
  )
order by indexname;
