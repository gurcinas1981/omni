# Architecture — OMNISYNAPSE Ω

**Product:** OMNISYNAPSE (new FOX service, supervisory tier above ORBIT and NEXUS).
**Home:** omni.foxintelligence.co.uk · repo `gurcinas1981/omni` · Vercel project `omni` · Supabase `fox-omnisynapse` (eu-west-2).

```
Owner (Visionary Innovator) ──approves──▶ OMNISYNAPSE Ω (this service)
                                          ├─ reads ◀── ORBIT  (GET /api/observability → orbit_events, read-only, live)
                                          ├─ proposes ──▶ NEXUS (task_proposals → signed fox.omni.task_proposal.v1; held until receiver exists)
                                          ├─ memory: evidence · recommendations · decisions · context_notes · knowledge graph
                                          └─ council: 17 instruction skills (agent-pack) → future specialist workflows
```

## Interfaces
| Interface | Direction | Status |
|---|---|---|
| `GET /api/health` | ORBIT → OMNI (poll) | Live, public, no data |
| `public.orbit_events` | ORBIT → OMNI | **Live** — `lib/integrations/orbit.ts` + RPC `record_orbit_sync` (owner-only SECURITY DEFINER; the only writer of orbit_events and the ORBIT systems row) |
| `public.task_proposals` | OMNI → NEXUS | Dispatcher built; held (`held_unconnected`) until `NEXUS_PROPOSALS_URL`/`_SECRET` exist — see `docs/NEXUS_PROPOSAL_RECEIVER.md` |
| `public.systems.connection_status` | adapter-verified only | `fox-orbit` set by the ORBIT adapter; others `UNCONNECTED` (their health is shown as ORBIT observations, not OMNI connections) |
| Ingest JSON (agent-pack schemas) | Owner → OMNI | Live via `/command/evidence` |

## Dependencies on other FOX products
- ORBIT (`fox-orbit`): will supply telemetry; needs a read-only token/event contract.
- NEXUS (`fox-nexus`): will accept bounded task proposals; needs an authenticated proposal endpoint.
- No shared database with other products; integration is by API contract only.

## Open questions for Tomas
1. ORBIT endpoint confirmed and connected. NEXUS has no task-proposal API yet — deploy the receiver in `docs/NEXUS_PROPOSAL_RECEIVER.md` when ready.
2. Supabase Auth → Site URL: set to `https://omni.foxintelligence.co.uk` (Dashboard → Authentication → URL Configuration) to enable magic-link sign-in.
3. Trademark check on "Omni-Synapse" before any external/commercial use (prior public use noted in agent-pack governance).
