-- Roda Festa V19.7 - PlanningSession duravel
-- Executar no projeto PostgreSQL/Supabase da Roda Festa antes de ativar a V19.7.
-- Nao inserir service-role key, senhas ou outros segredos neste arquivo.

create extension if not exists pgcrypto;

create table if not exists public.planning_sessions (
  id uuid primary key default gen_random_uuid(),
  client_request_id text not null unique,
  anonymous_session_token_hash text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','FINALIZED','ABANDONED','EXPIRED')),
  source text not null default 'planner-web',
  client_name text,
  phone text,
  email text,
  input_snapshot jsonb not null,
  recommendation_snapshot jsonb not null,
  planning_changes jsonb not null default '[]'::jsonb,
  final_proposal_snapshot jsonb,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  finalized_at timestamptz,
  constraint planning_sessions_finalized_has_snapshot check (
    status <> 'FINALIZED' or final_proposal_snapshot is not null
  )
);

create index if not exists planning_sessions_status_idx on public.planning_sessions(status);
create index if not exists planning_sessions_token_hash_idx on public.planning_sessions(anonymous_session_token_hash);
create index if not exists planning_sessions_last_activity_idx on public.planning_sessions(last_activity_at desc);
create index if not exists planning_sessions_phone_idx on public.planning_sessions(phone) where phone is not null;
create unique index if not exists planning_sessions_proposal_code_uidx
  on public.planning_sessions ((final_proposal_snapshot->>'code'))
  where final_proposal_snapshot is not null;

alter table public.planning_sessions enable row level security;

-- Deliberadamente nenhuma policy para anon/authenticated.
-- O navegador nunca acessa esta tabela diretamente. Somente a API server-side usa service role.
revoke all on table public.planning_sessions from anon, authenticated;

create or replace function public.set_planning_sessions_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planning_sessions_set_updated_at on public.planning_sessions;
create trigger planning_sessions_set_updated_at
before update on public.planning_sessions
for each row execute function public.set_planning_sessions_updated_at();

comment on table public.planning_sessions is
'Roda Festa: jornada anonima server-side. Token de sessao armazenado somente como SHA-256; snapshots historicos preservam versoes e valores aplicados.';

create or replace function public.protect_planning_session_history()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.client_request_id is distinct from old.client_request_id
     or new.anonymous_session_token_hash is distinct from old.anonymous_session_token_hash
     or new.input_snapshot is distinct from old.input_snapshot
     or new.recommendation_snapshot is distinct from old.recommendation_snapshot then
    raise exception 'immutable_planning_session_origin';
  end if;

  if old.final_proposal_snapshot is not null
     and new.final_proposal_snapshot is distinct from old.final_proposal_snapshot then
    raise exception 'immutable_final_proposal_snapshot';
  end if;

  if old.status = 'FINALIZED' and new.status is distinct from old.status then
    raise exception 'finalized_session_status_is_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists planning_sessions_protect_history on public.planning_sessions;
create trigger planning_sessions_protect_history
before update on public.planning_sessions
for each row execute function public.protect_planning_session_history();
