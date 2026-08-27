-- Roda Festa V19.8 - server-owned proposal codes
-- Global daily sequence allocated atomically inside PostgreSQL/Supabase.
-- Browser/localStorage is never the authority for a canonical proposal code.

create table if not exists public.planning_proposal_sequences (
  business_date date primary key,
  last_value integer not null check (last_value >= 0),
  updated_at timestamptz not null default now()
);

alter table public.planning_proposal_sequences enable row level security;
revoke all on table public.planning_proposal_sequences from anon, authenticated;

create or replace function public.allocate_planning_proposal_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_date date := (timezone('America/Sao_Paulo', now()))::date;
  v_date_part text := to_char((timezone('America/Sao_Paulo', now()))::date, 'YYMMDD');
  v_existing_max integer := 0;
  v_sequence integer;
begin
  select coalesce(max(right(ps.final_proposal_snapshot->>'code', 5)::integer), 0)
    into v_existing_max
  from public.planning_sessions ps
  where ps.final_proposal_snapshot is not null
    and (ps.final_proposal_snapshot->>'code') ~ ('^RF-' || v_date_part || '-[0-9]{5}$');

  insert into public.planning_proposal_sequences (business_date, last_value, updated_at)
  values (v_business_date, v_existing_max + 1, now())
  on conflict (business_date) do update
    set last_value = public.planning_proposal_sequences.last_value + 1,
        updated_at = now()
  returning last_value into v_sequence;

  if v_sequence > 99999 then
    raise exception 'planning_proposal_sequence_exhausted';
  end if;

  return 'RF-' || v_date_part || '-' || lpad(v_sequence::text, 5, '0');
end;
$$;

revoke all on function public.allocate_planning_proposal_code() from public, anon, authenticated;
grant execute on function public.allocate_planning_proposal_code() to service_role;

comment on function public.allocate_planning_proposal_code() is
'Roda Festa: allocates the canonical daily proposal code server-side using an atomic PostgreSQL sequence row; bootstraps from already-finalized proposal codes.';
