# ORBIT / NEXUS integration contract — reference design (NOT existing deployed APIs)

All endpoints are proposals and must be mapped to actual verified implementations. Do not assume URLs are currently live.

## ORBIT -> OMNISYNAPSE (read-only)

Suggested events: `system_registered`, `health_observed`, `deployment_observed`, `spend_observed`, `agent_failed`, `agent_completed`, `risk_flagged`. Response includes `event_id`, `source_system`, `timestamp`, `observed_at`, `project_id`, `evidence_uri`, `confidence`, `status`, `metrics` and source authorisation scope. Observe source telemetry; do not derive "all systems healthy" from missing events.

## OMNISYNAPSE -> NEXUS (bounded task request)

`POST /v1/tasks/proposals` (proposed only)

```json
{"task_id":"...","requested_by":"omnisynapse","requested_for":"owner","intent":"inspect_repo_health","target_system":"github","project_id":"fox-orbit","scope":"read:repo_metadata","risk_tier":"R1","approval_status":"required","max_cost_gbp":1.00,"idempotency_key":"...","reason":"...","evidence_ids":["ev_..."]}
```

Execution is independent: NEXUS must separately authenticate, authorise and log. A response may be `accepted_for_review`, not `completed`.

## NEXUS -> OMNISYNAPSE

Events: `task_approved`, `task_rejected`, `task_started`, `task_finished`, `task_failed`, `task_rolled_back`, with signed approvals and independently verified outcome fields.

## Knowledge data

Use an append-only event history with versioned business entities and signed-outcome metadata. Suggested entities: `Project`, `System`, `Agent`, `Skill`, `Evidence`, `Claim`, `Hypothesis`, `Decision`, `Experiment`, `Outcome`, `Person`, `Organisation`, `Opportunity`. Graph edges: `DEPENDS_ON`, `CONTRADICTS`, `SUPPORTS`, `USED_BY`, `IMPACTS`, `LEARNED_FROM`, `VERIFIED_BY`. Avoid storing sensitive personal details unless necessary and consented.

## Suggested deployment target

Private authenticated dashboard on an approved domain plus backend API; GitHub for version control; Vercel for UI; Supabase/Postgres for data; NEXUS for orchestration; ORBIT for monitoring. Choices remain contingent on actual architecture, price and compliance.
