-- ORBIT read-only adapter.
-- OMNI's server pulls ORBIT's fox.observability.snapshot.v1 with a dedicated bearer (ORBIT_READ_TOKEN),
-- maps it to orbit_events and records the result through this owner-only function.
-- There is still no service-role key in the app: the function runs for the signed-in owner and is the
-- only path that may write orbit_events or change the ORBIT row in public.systems.

create or replace function public.record_orbit_sync(events jsonb, ok boolean, evidence text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_in int := 0;
  n_new int := 0;
  prev text;
  next_status text;
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'record_orbit_sync: owner only';
  end if;
  if events is null or jsonb_typeof(events) <> 'array' then
    raise exception 'record_orbit_sync: events must be a JSON array';
  end if;
  n_in := jsonb_array_length(events);
  if n_in > 200 then
    raise exception 'record_orbit_sync: too many events (%)', n_in;
  end if;
  if not ok and n_in > 0 then
    raise exception 'record_orbit_sync: a failed sync cannot carry events';
  end if;

  with src as (
    select
      left(e->>'event_id', 160)                as event_id,
      e->>'event_type'                         as event_type,
      left(e->>'project_id', 64)               as project_id,
      (e->>'observed_at')::timestamptz         as observed_at,
      left(e->>'status', 48)                   as status,
      least(greatest(coalesce((e->>'confidence')::numeric, 0), 0), 1) as confidence,
      coalesce(e->'metrics', '{}'::jsonb)      as metrics,
      left(e->>'evidence_uri', 500)            as evidence_uri
    from jsonb_array_elements(events) e
  ), ins as (
    insert into public.orbit_events (event_id, event_type, source_system, project_id, observed_at, status, confidence, metrics, evidence_uri)
    select event_id, event_type, 'fox-orbit', project_id, observed_at, status, confidence, metrics, evidence_uri
    from src
    where event_id like 'orbit:%'
      and observed_at <= now() + interval '10 minutes'
      and jsonb_typeof(metrics) = 'object'
      and octet_length(metrics::text) <= 4000
    on conflict (event_id) do nothing
    returning 1
  )
  select count(*) into n_new from ins;

  select connection_status into prev from public.systems where id = 'fox-orbit';
  -- Verified only on an observed, authenticated read. A failure after a verified read is FAILED;
  -- a failure before any verified read leaves the row UNCONNECTED (never claimed).
  next_status := case
    when ok then 'READ_ONLY_VERIFIED'
    when prev in ('READ_ONLY_VERIFIED', 'DEGRADED', 'FAILED') then 'FAILED'
    else coalesce(prev, 'UNCONNECTED')
  end;

  update public.systems
     set connection_status = next_status,
         last_verified = case when ok then now() else last_verified end,
         verification_evidence = left(coalesce(evidence, ''), 500),
         updated_at = now()
   where id = 'fox-orbit';

  return jsonb_build_object('received', n_in, 'inserted', n_new, 'connection_status', next_status);
end $$;

revoke all on function public.record_orbit_sync(jsonb, boolean, text) from public, anon;
grant execute on function public.record_orbit_sync(jsonb, boolean, text) to authenticated;

create index if not exists orbit_events_project_obs_idx on public.orbit_events(project_id, observed_at desc);
