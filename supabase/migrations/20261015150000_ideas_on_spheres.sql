-- Every proposal / idea is assigned to one OMNI sphere (category). Ideas render as moons around that
-- sphere in the ecosphere: pending = hollow pulsing moon, confirmed (approved → verified) = solid gold moon.
alter table public.recommendations add column if not exists sphere_id text;
alter table public.recommendations drop constraint if exists recommendations_sphere_valid;
alter table public.recommendations add constraint recommendations_sphere_valid check (
  sphere_id is null or sphere_id in (
    'omnisynapse','fox','altar','human-consciousness','galaxy','pyramid','sacred-geometry',
    'eye','scarab','logic-mandala','synthesis','guardian-security','guardian-integrity'
  )
);
create index if not exists recommendations_sphere_idx on public.recommendations(sphere_id);

-- Assign the clearly-labelled demo proposals so the mechanism is visible.
update public.recommendations set sphere_id = 'sacred-geometry' where id = 'demo-shared-site-identity' and sphere_id is null;
update public.recommendations set sphere_id = 'scarab' where id = 'demo-agent-skills' and sphere_id is null;
