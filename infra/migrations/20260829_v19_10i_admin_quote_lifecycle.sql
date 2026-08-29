-- Roda Festa V19.10I
-- Administrative lifecycle for quotes: reversible archive/trash without touching
-- commercial status, snapshots or planning history.

begin;

alter table public.planning_sessions
  add column if not exists admin_state text not null default 'ACTIVE',
  add column if not exists admin_state_updated_at timestamptz,
  add column if not exists admin_state_updated_by text,
  add column if not exists archived_at timestamptz,
  add column if not exists trashed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'planning_sessions_admin_state_check'
      and conrelid = 'public.planning_sessions'::regclass
  ) then
    alter table public.planning_sessions
      add constraint planning_sessions_admin_state_check
      check (admin_state in ('ACTIVE', 'ARCHIVED', 'TRASHED'));
  end if;
end $$;

create index if not exists planning_sessions_admin_state_activity_idx
  on public.planning_sessions (admin_state, last_activity_at desc);

comment on column public.planning_sessions.admin_state is
  'Administrative visibility only. Does not replace commercial planning status.';
comment on column public.planning_sessions.admin_state_updated_by is
  'Server-trusted admin principal id responsible for the latest lifecycle change.';

commit;
