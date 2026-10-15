-- OMNISYNAPSE Ω — core institutional memory, evidence, approvals and audit.
-- Dedicated Supabase project: fox-omnisynapse (eu-west-2).
-- Security model: every table has RLS; only rows in public.owners may read/write.
-- Approval transitions are enforced in the database (trigger), not only in the UI.

create extension if not exists pgcrypto;

-- ───────────────────────── Owners (Visionary Innovator / admins) ─────────────
create table if not exists public.owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','viewer')),
  created_at timestamptz not null default now()
);
alter table public.owners enable row level security;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.owners o where o.user_id = auth.uid() and o.role in ('owner','admin'));
$$;
create or replace function public.is_viewer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.owners o where o.user_id = auth.uid());
$$;
revoke all on function public.is_owner() from public, anon;
revoke all on function public.is_viewer() from public, anon;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_viewer() to authenticated;

create policy owners_self_read on public.owners for select to authenticated using (user_id = auth.uid());

-- ───────────────────────── FOX systems registry ─────────────────────────────
create table if not exists public.systems (
  id text primary key,
  name text not null,
  reference_url text,
  category text,
  description text,
  connection_status text not null default 'UNCONNECTED'
    check (connection_status in ('UNCONNECTED','LINK_ONLY','READ_ONLY_VERIFIED','WRITE_SCOPED','DEGRADED','FAILED')),
  last_verified timestamptz,
  verification_evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Evidence (source provenance) ─────────────────────
create table if not exists public.evidence (
  id text primary key check (char_length(id) between 1 and 128),
  title text not null,
  summary text not null,
  source_url text not null check (source_url ~* '^https?://[^/@\s]+(/|$)'),
  source_type text not null default 'web',
  published_at timestamptz,
  observed_at timestamptz not null,
  classification text not null check (classification in
    ('verified_primary','credible_secondary','internal_verified','unverified','hypothesis','speculative')),
  project_id text not null,
  confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),
  demo boolean not null default false,
  ingested_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────────────────── Recommendations + approval state machine ────────
create table if not exists public.recommendations (
  id text primary key check (char_length(id) between 1 and 128),
  title text not null,
  summary text not null,
  impacted_systems text[] not null default '{}',
  cognitive_benefit text not null,
  evidence_ids text[] not null default '{}',
  cost_gbp numeric check (cost_gbp is null or cost_gbp >= 0),
  estimated_effort text not null,
  scores jsonb not null default '{}'::jsonb,
  risk_tier text not null default 'R0' check (risk_tier in ('R0','R1','R2','R3','R4')),
  status text not null default 'proposed' check (status in
    ('proposed','reviewed','approved','rejected','queued','running','verified_complete','failed','rolled_back')),
  proposed_by text not null default 'omnisynapse',
  council_cell text,
  human_approved_by uuid references auth.users(id),
  human_approved_at timestamptz,
  approval_note text,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.enforce_recommendation_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare allowed text[];
begin
  if tg_op = 'INSERT' then
    -- Agents may only ever create proposals. Nothing is born approved.
    if new.status not in ('proposed','reviewed') then
      raise exception 'New recommendations must start as proposed or reviewed (got %)', new.status;
    end if;
    new.human_approved_by := null; new.human_approved_at := null;
    return new;
  end if;
  if new.status = old.status then
    new.updated_at := now();
    return new;
  end if;
  allowed := case old.status
    when 'proposed' then array['reviewed','rejected']
    when 'reviewed' then array['approved','rejected','proposed']
    when 'approved' then array['queued','rejected']
    when 'queued'   then array['running','failed','rejected']
    when 'running'  then array['verified_complete','failed','rolled_back']
    when 'failed'   then array['proposed','rolled_back']
    else array[]::text[] end;
  if not (new.status = any(allowed)) then
    raise exception 'Illegal transition % -> %', old.status, new.status;
  end if;
  if new.status = 'approved' then
    if auth.uid() is null or not public.is_owner() then
      raise exception 'Only an authenticated human owner can approve';
    end if;
    if new.risk_tier = 'R4' then
      raise exception 'R4 actions are not available in this service';
    end if;
    new.human_approved_by := auth.uid();
    new.human_approved_at := now();
  end if;
  new.updated_at := now();
  insert into public.audit_events(actor, action, resource_type, resource_id, extra)
  values (coalesce(auth.uid()::text,'system'), 'transition', 'recommendation', new.id,
          jsonb_build_object('from', old.status, 'to', new.status, 'note', new.approval_note));
  return new;
end $$;

-- ───────────────────────── Decision ledger (institutional memory) ──────────
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  title text not null,
  hypothesis text not null,
  options jsonb not null default '[]'::jsonb,
  chosen_option text,
  rationale text,
  approved_by_human boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  expected_outcome text,
  observed_outcome text,
  lessons text,
  evidence_ids text[] not null default '{}',
  review_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Connectome (typed knowledge graph) ──────────────
create table if not exists public.knowledge_entities (
  id text primary key,
  entity_type text not null check (entity_type in
    ('Project','System','Agent','Skill','Evidence','Claim','Hypothesis','Decision','Experiment','Outcome','Organisation','Opportunity')),
  project_id text,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.knowledge_edges (
  id bigint generated always as identity primary key,
  from_id text not null references public.knowledge_entities(id) on delete cascade,
  to_id text not null references public.knowledge_entities(id) on delete cascade,
  relation text not null check (relation in ('DEPENDS_ON','CONTRADICTS','SUPPORTS','USED_BY','IMPACTS','LEARNED_FROM','VERIFIED_BY')),
  evidence_id text references public.evidence(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint no_self_reference check (from_id <> to_id),
  unique (from_id, to_id, relation)
);

-- ───────────────────────── NEXUS task proposals (outbound, queued only) ────
create table if not exists public.task_proposals (
  task_id uuid primary key default gen_random_uuid(),
  recommendation_id text references public.recommendations(id) on delete set null,
  requested_by text not null default 'omnisynapse',
  intent text not null,
  target_system text not null,
  project_id text not null,
  scope text not null,
  risk_tier text not null check (risk_tier in ('R0','R1','R2','R3')),
  max_cost_gbp numeric not null default 0 check (max_cost_gbp >= 0),
  reason text not null,
  evidence_ids text[] not null default '{}',
  idempotency_key text not null unique default encode(gen_random_bytes(12),'hex'),
  dispatch_status text not null default 'held_unconnected'
    check (dispatch_status in ('held_unconnected','awaiting_approval','sent','accepted_for_review','rejected','finished','failed')),
  created_at timestamptz not null default now()
);

-- ───────────────────────── ORBIT telemetry inbox (read-only signals) ───────
create table if not exists public.orbit_events (
  event_id text primary key,
  event_type text not null check (event_type in
    ('system_registered','health_observed','deployment_observed','spend_observed','agent_failed','agent_completed','risk_flagged')),
  source_system text not null,
  project_id text,
  observed_at timestamptz not null,
  status text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  metrics jsonb not null default '{}'::jsonb,
  evidence_uri text,
  received_at timestamptz not null default now()
);

-- ───────────────────────── Cognitive amplifier: working context notes ──────
create table if not exists public.context_notes (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Append-only audit ───────────────────────────────
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  extra jsonb not null default '{}'::jsonb
);

create trigger recommendations_transition
  before insert or update on public.recommendations
  for each row execute function public.enforce_recommendation_transition();

create or replace function public.audit_generic()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_events(actor, action, resource_type, resource_id)
  values (coalesce(auth.uid()::text,'system'), lower(tg_op), tg_table_name,
          coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'task_id', to_jsonb(new)->>'event_id', to_jsonb(old)->>'id', '?'));
  return coalesce(new, old);
end $$;
create trigger evidence_audit after insert or update or delete on public.evidence for each row execute function public.audit_generic();
create trigger decisions_audit after insert or update or delete on public.decisions for each row execute function public.audit_generic();
create trigger tasks_audit after insert or update on public.task_proposals for each row execute function public.audit_generic();
create trigger systems_audit after update on public.systems for each row execute function public.audit_generic();

-- Audit is append-only for everyone except table owner.
create or replace function public.audit_immutable() returns trigger language plpgsql set search_path = public as $$
begin raise exception 'audit_events is append-only'; end $$;
create trigger audit_no_update before update or delete on public.audit_events for each row execute function public.audit_immutable();

-- ───────────────────────── RLS: owner-only everywhere ──────────────────────
do $$
declare t text;
begin
  foreach t in array array['systems','evidence','recommendations','decisions','knowledge_entities','knowledge_edges','task_proposals','orbit_events','context_notes','audit_events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_viewer())', t||'_read', t);
  end loop;
  foreach t in array array['evidence','recommendations','decisions','knowledge_entities','knowledge_edges','task_proposals','context_notes']
  loop
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_owner())', t||'_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_owner()) with check (public.is_owner())', t||'_update', t);
  end loop;
  foreach t in array array['evidence','decisions','context_notes','knowledge_edges']
  loop
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_owner())', t||'_delete', t);
  end loop;
end $$;
-- Systems connection status may only be changed by a verified adapter (service role), never by the UI.
-- ORBIT events are inserted server-side only (service role / future edge function).

revoke all on all tables in schema public from anon;

create index if not exists evidence_project_idx on public.evidence(project_id);
create index if not exists recommendations_status_idx on public.recommendations(status);
create index if not exists orbit_events_obs_idx on public.orbit_events(observed_at desc);
create index if not exists audit_at_idx on public.audit_events(at desc);
