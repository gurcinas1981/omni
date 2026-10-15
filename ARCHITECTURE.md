# Architecture — OMNISYNAPSE Ω

**Product:** OMNISYNAPSE (new FOX service, supervisory tier above ORBIT and NEXUS).
**Home:** omni.foxintelligence.co.uk · repo `gurcinas1981/omni` · Vercel project `omni` · Supabase `fox-omnisynapse` (eu-west-2).

```
Owner (Visionary Innovator) ──approves──▶ OMNISYNAPSE Ω (this service)
                                          ├─ reads ◀── ORBIT  (planned: orbit_events, read-only)
                                          ├─ proposes ──▶ NEXUS (planned: task_proposals → POST /v1/tasks/proposals)
                                          ├─ memory: evidence · recommendations · decisions · context_notes · knowledge graph
                                          └─ council: 17 instruction skills (agent-pack) → future specialist workflows
```

## Interfaces
| Interface | Direction | Status |
|---|---|---|
| `GET /api/health` | ORBIT → OMNI (poll) | Live, public, no data |
| `public.orbit_events` | ORBIT → OMNI | Table + UI ready; adapter **UNCONNECTED** |
| `public.task_proposals` | OMNI → NEXUS | Proposals held with `dispatch_status = held_unconnected` |
| `public.systems.connection_status` | adapter-verified only | All `UNCONNECTED` |
| Ingest JSON (agent-pack schemas) | Owner → OMNI | Live via `/command/evidence` |

## Dependencies on other FOX products
- ORBIT (`fox-orbit`): will supply telemetry; needs a read-only token/event contract.
- NEXUS (`fox-nexus`): will accept bounded task proposals; needs an authenticated proposal endpoint.
- No shared database with other products; integration is by API contract only.

## Open questions for Tomas
1. Confirm ORBIT's public event/health endpoint and whether NEXUS already exposes a task-proposal API.
2. Supabase Auth → Site URL: set to `https://omni.foxintelligence.co.uk` (Dashboard → Authentication → URL Configuration) to enable magic-link sign-in.
3. Trademark check on "Omni-Synapse" before any external/commercial use (prior public use noted in agent-pack governance).
