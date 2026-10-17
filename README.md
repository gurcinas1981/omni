# OMNISYNAPSE Ω — FOX Intelligence supervisory service

**One Mind. Infinite Connections. Continuous Evolution.**

Private supervisory and cognitive-amplification layer of the FOX ecosystem, deployed at **https://omni.foxintelligence.co.uk**.
Hierarchy: **Visionary Innovator → OMNISYNAPSE Ω → ORBIT (observe) / NEXUS (execute) → Expert council → FOX platforms.**
OMNISYNAPSE recommends; only the authenticated human owner approves.

## What is live

| Area | Route | Status |
|---|---|---|
| Cognitive Universe — interactive 3D temple (dual brain, Ω emblem, FOX insignia, 8 domain medallions, guardians, altar, circuit floor) | `/` | Public, no private data |
| Owner sign-in (password; magic link once Site URL is set) | `/login` | Live |
| Daily executive brief (top-3, sourced or not shown; demo toggle) | `/command` | Live |
| Approval queue — DB-enforced state machine, NEXUS task proposals held | `/command/approvals` | Live |
| Evidence ledger + JSON ingestion (agent-pack schemas) | `/command/evidence` | Live |
| Persistent decision memory, outcomes, lessons, working context, recall | `/command/memory` | Live |
| Expert council — 8 cells, 17 skills (instruction-only, honestly labelled) | `/command/council` | Live |
| FOX systems registry + ORBIT read-only adapter (health, deployments, P0 risks) | `/command/systems` | Live · ORBIT read verified on first owner visit (auto-refresh ≥15 min) |
| Governance, risk tiers, password change | `/command/governance` | Live |
| Append-only audit trail | `/command/audit` | Live |
| Health probe for ORBIT (configuration only, no data) | `/api/health` | Live |

**ORBIT:** connected read-only — OMNI pulls `GET /api/observability` (`fox.observability.snapshot.v1`) server-side with `ORBIT_READ_TOKEN` (= `OMNI_READ_TOKEN` on fox-orbit) and records it via the owner-only RPC `record_orbit_sync`.
**NEXUS:** proposal contract and signed dispatcher built (`lib/integrations/nexus*.ts`, `docs/NEXUS_PROPOSAL_RECEIVER.md`); held until NEXUS deploys a receiver and `NEXUS_PROPOSALS_URL` / `NEXUS_PROPOSALS_SECRET` are set.
**Not yet built:** specialist execution workflows for the 17 skills (no model API key on omni). Nothing in the UI claims otherwise.

## Stack
Next.js 15 (App Router, TypeScript) · React Three Fiber + drei + postprocessing · Supabase (Postgres, Auth, RLS) project `fox-omnisynapse` (eu-west-2) · Vercel (team *Fox*).

## Security model
- Every table has RLS; only rows in `public.owners` can read/write. `anon` has no grants.
- Approval transitions enforced by trigger `enforce_recommendation_transition` (no skip-review, only an authenticated owner can approve, R4 blocked, nothing born approved).
- `audit_events` is append-only (trigger rejects update/delete).
- No service-role key exists in this app — all queries run as the signed-in user.
- Middleware gates `/command/*`; the command layout re-checks owner role server-side.

## Local development
```bash
cp .env.example .env.local   # fill in the publishable key
npm install
npm run dev                  # http://localhost:3000
npm test                     # vitest: engine + governance tests
npm run typecheck && npm run build
```

## Automated checks
The `OMNI build and tests` GitHub Actions workflow runs on pull requests and pushes
to `main`. It installs dependencies from
`package-lock.json` and reports app tests, TypeScript validation, production build,
and Python reference tests as separate checks. The test job also verifies that
the agent bundle generator works from paths containing spaces.
These checks use no deployment or database credentials and do not deploy.

Run the additional checks locally with `node --test scripts/build-skills.test.mjs`
and, from `agent-pack/python-runtime`, `python -m unittest discover -s tests -v`.

## Database
Migrations in `supabase/migrations/` (already applied to `fox-omnisynapse`). Apply to a new project with the Supabase CLI: `supabase db push`.
Add another owner: insert their `auth.users.id` into `public.owners` (role `owner`, `admin` or `viewer`).

## Agent pack
`agent-pack/` holds the original OMNISYNAPSE instruction pack: master prompt, 17 `SKILL.md` files, JSON schemas, scoring/council/ecosystem config, workflows, templates, environment brief and the tested Python reference runtime. `scripts/build-skills.mjs` compiles skills + config into the app at build time — edit the pack, redeploy, and the council page updates.

## Ingestion contract
```json
{ "kind": "evidence" | "recommendation", "records": [ … ] }
```
See `agent-pack/schemas/*.schema.json`. Recommendations always enter as `proposed`; existing recommendation IDs are never overwritten.
