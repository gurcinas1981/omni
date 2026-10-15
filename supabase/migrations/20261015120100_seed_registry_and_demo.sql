-- FOX registry (reference identifiers only — NOT connection claims) and clearly-labelled DEMO records.
insert into public.systems (id, name, reference_url, category, description, connection_status) values
 ('fox-orbit','ORBIT','https://ecosystem.foxintelligence.co.uk/','observability','Monitoring and visual intelligence layer','UNCONNECTED'),
 ('fox-nexus','NEXUS','https://nexus.foxintelligence.co.uk/','orchestration','Authenticated execution and connector system','UNCONNECTED'),
 ('fox-land-iq','LAND IQ','https://landiq.foxintelligence.co.uk/','land-analytics','Site constraints → residual value → horizon scenarios → probability output','UNCONNECTED'),
 ('fox-land-search','LAND SEARCH','https://land.foxatlas.co.uk/','discovery','Land-for-sale listing search against preset filters','UNCONNECTED'),
 ('fox-planning-radar','PLANNING RADAR','https://radar.foxintelligence.co.uk/','policy','Policy, consultation and application monitoring','UNCONNECTED'),
 ('fox-land-passport','LAND PASSPORT','https://derbypilot.foxintelligence.co.uk/','digital-twin','Persistent site/asset identity and digital twin','UNCONNECTED'),
 ('fox-atlas','FOX ATLAS','https://www.foxatlas.co.uk/','presentation','Digital Land ID microsites and land storytelling','UNCONNECTED'),
 ('fox-intelligence','FOX INTELLIGENCE','https://www.foxintelligence.co.uk/','corporate','Parent brand','UNCONNECTED'),
 ('fox-observatory','OBSERVATORY',null,'monitoring','Operations, performance, connections and audit (not yet built)','UNCONNECTED')
on conflict (id) do nothing;

insert into public.evidence (id,title,summary,source_url,published_at,observed_at,classification,project_id,confidence,demo) values
 ('demo-planning-docs','DEMO — England Planning Data documentation (reference only)','Illustrative evidence entry demonstrating how a primary planning data source might be linked to FOX analysis. Content and coverage must be freshly checked before real use.','https://www.planning.data.gov.uk/docs',null,'2026-10-15T10:00:00+01:00','verified_primary','fox-land-iq',0.7,true),
 ('demo-agent-skill-spec','DEMO — Agent Skills specification (reference only)','Illustrative documentation evidence for using portable SKILL.md instructions. Confirm the actual host implementation and permissions.','https://agentskills.io/specification',null,'2026-10-15T10:00:00+01:00','verified_primary','fox-nexus',0.8,true)
on conflict (id) do nothing;

insert into public.recommendations (id,title,summary,impacted_systems,cognitive_benefit,evidence_ids,cost_gbp,estimated_effort,scores,status,demo,council_cell) values
 ('demo-shared-site-identity','DEMO — Shared Site Record across FOX','Hypothetical proposal to connect land discoveries, planning risk, feasibility and digital-twin records around a persistent parcel/site identity.',
  array['LAND IQ','LAND SEARCH','PLANNING RADAR','LAND PASSPORT'],'Fewer repeated site checks and better traceability of decisions',array['demo-planning-docs'],null,'Medium (unvalidated)',
  '{"strategic_alignment":5,"commercial_value":4,"cross_platform_reuse":5,"technical_feasibility":3,"cognitive_amplification":4,"evidence_strength":3,"implementation_effort":3,"security_risk":2,"uncertainty":3}','proposed',true,'land-construction'),
 ('demo-agent-skills','DEMO — Agent Skill Registry and Evaluation','Hypothetical proposal to standardise NEXUS specialist workflows as testable, auditable agent skills.',
  array['NEXUS','ORBIT'],'Reusable, reviewable reasoning workflows and fewer inconsistent outputs',array['demo-agent-skill-spec'],null,'Low to medium (unvalidated)',
  '{"strategic_alignment":5,"commercial_value":3,"cross_platform_reuse":5,"technical_feasibility":4,"cognitive_amplification":4,"evidence_strength":4,"implementation_effort":2,"security_risk":2,"uncertainty":2}','proposed',true,'ai-computing')
on conflict (id) do nothing;
