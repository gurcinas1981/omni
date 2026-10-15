# NEXUS proposal receiver — contract for `fox.omni.task_proposal.v1`

**Status:** OMNI side built and tested; **NEXUS side not deployed**. Live NEXUS (`dpl_HfhfYzjTWBMyRR2sLCsdpwN3v2Ep`) exposes `/api/hook` (fixed tool list) and `/api/telemetry` (`fox.telemetry.event.v1`) only. Until a receiver exists, OMNI keeps every proposal `held_unconnected` and shows no "send" button.

## What OMNI sends

`POST <NEXUS_PROPOSALS_URL>` — suggested `https://nexus.foxintelligence.co.uk/api/omni-proposals`. The NEXUS gate already leaves `/api/*` to handlers, so the receiver must authenticate itself.

Headers

| Header | Value |
|---|---|
| `Authorization` | `Bearer <NEXUS_PROPOSALS_SECRET>` |
| `X-Fox-Timestamp` | Unix ms when signed |
| `X-Fox-Signature` | `sha256=` + hex HMAC-SHA256(secret, `${timestamp}.${rawBody}`) |
| `Idempotency-Key` | `task_proposals.idempotency_key` |

Body (example)

```json
{
  "schema": "fox.omni.task_proposal.v1",
  "task_id": "6c3e…",
  "requested_by": "omnisynapse",
  "requested_for": "owner",
  "approved_by_owner": true,
  "recommendation_id": "rec-…",
  "intent": "inspect_repo_health",
  "target_system": "github",
  "project_id": "fox-orbit",
  "scope": "read:repo_metadata",
  "risk_tier": "R1",
  "approval_status": "required",
  "max_cost_gbp": 1,
  "idempotency_key": "…",
  "reason": "…",
  "evidence_ids": ["ev-…"],
  "issued_at": "2026-10-15T16:00:00.000Z"
}
```

OMNI only sends when: the owner clicks **Send to NEXUS for review**; the linked recommendation is `approved`; risk is R0–R2; cap ≤ £50; status is `held_unconnected` or `failed`.

## What the receiver must do

1. Reject anything over 16 KB, any timestamp more than 5 minutes off, any bad bearer or signature (constant-time compare). Reference: `verify()` in `lib/integrations/nexusContract.ts`.
2. Check `schema`, `risk_tier ∈ {R0,R1,R2}`, `approval_status = "required"`.
3. Store the proposal in NEXUS's own queue **for NEXUS-side review** — never execute on receipt.
4. Reply:
   - `202 {"status":"accepted_for_review","task_id":"…"}` — stored;
   - `409 {"status":"accepted_for_review"}` — same `Idempotency-Key` seen before;
   - `422 {"status":"rejected","reason":"…"}` — valid request NEXUS will not take.
   Anything else is recorded by OMNI as `failed` (retryable).

## Turning it on

1. Deploy the receiver on NEXUS (NEXUS source is not fully in Git — deploy by SHA reference as done for `/api/telemetry`, see fox-orbit `docs/FOX-OBSERVABILITY.md`).
2. Generate a 64-hex secret; set `NEXUS_PROPOSALS_SECRET` (sensitive) on **fox-nexus** and **omni**, and `NEXUS_PROPOSALS_URL` on **omni**.
3. Redeploy omni. `/api/health` then reports `nexus: CONFIGURED`; the button appears on eligible proposals.

## Later (NEXUS → OMNI)

Outcome events (`task_started`, `task_finished`, `task_failed`, `task_rolled_back`) should flow back through the FOX telemetry store with `component_id: "nexus"`, and OMNI's ORBIT adapter (or a direct reader) moves proposals to `finished`/`failed` only on those observed events.
