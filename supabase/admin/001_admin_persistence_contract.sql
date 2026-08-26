-- V19.7S — Admin Persistence Schema Contract
-- Contract only. Do not execute automatically.
-- Designed for Supabase/Postgres, server-side access only.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  role text not null,
  capabilities jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  credential_algorithm text not null,
  credential_salt text not null,
  credential_hash text not null,
  credential_key_length integer not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_users_identifier_normalized_check
    check (identifier = lower(trim(identifier)) and length(identifier) > 0),

  constraint admin_users_role_not_blank_check
    check (length(trim(role)) > 0),

  constraint admin_users_capabilities_array_check
    check (jsonb_typeof(capabilities) = 'array'),

  constraint admin_users_credential_algorithm_not_blank_check
    check (length(trim(credential_algorithm)) > 0),

  constraint admin_users_credential_salt_not_blank_check
    check (length(trim(credential_salt)) > 0),

  constraint admin_users_credential_hash_not_blank_check
    check (length(trim(credential_hash)) > 0),

  constraint admin_users_credential_key_length_check
    check (credential_key_length >= 16)
);

create unique index if not exists admin_users_identifier_uidx
  on public.admin_users (identifier);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role text not null,
  capabilities jsonb not null default '[]'::jsonb,
  token_hash text not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  rotated_at timestamptz,
  metadata jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_sessions_user_id_not_blank_check
    check (length(trim(user_id)) > 0),

  constraint admin_sessions_role_not_blank_check
    check (length(trim(role)) > 0),

  constraint admin_sessions_capabilities_array_check
    check (jsonb_typeof(capabilities) = 'array'),

  constraint admin_sessions_token_hash_not_blank_check
    check (length(trim(token_hash)) > 0),

  constraint admin_sessions_expiry_after_issue_check
    check (expires_at > issued_at),

  constraint admin_sessions_revoked_after_issue_check
    check (revoked_at is null or revoked_at >= issued_at),

  constraint admin_sessions_rotated_after_issue_check
    check (rotated_at is null or rotated_at >= issued_at),

  constraint admin_sessions_version_positive_check
    check (version >= 1)
);

create unique index if not exists admin_sessions_token_hash_uidx
  on public.admin_sessions (token_hash);

create index if not exists admin_sessions_user_id_idx
  on public.admin_sessions (user_id);

create index if not exists admin_sessions_active_lookup_idx
  on public.admin_sessions (token_hash, revoked_at, expires_at);

alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.admin_sessions from anon, authenticated;

-- No anon/authenticated RLS policy is intentionally created.
-- Access is expected only through server-side service-role requests.
