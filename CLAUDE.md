# OMNISYNAPSE — instructions for coding agents
Read `AGENTS.md`, `ARCHITECTURE.md` and `agent-pack/prompts/OMNISYNAPSE_MASTER_PROMPT.md` first.
- Never add a service-role key or any secret to client code. All data access goes through RLS as the signed-in owner.
- Never mark a system connected, a skill running, or an integration live without observed evidence.
- Approval logic lives in the database trigger; keep `lib/engine/core.ts` `TRANSITIONS` in sync and add a test for any change.
- British English. FOX brand: Heritage Green, Antique Gold #C8A96A, Parchment #F7F6F1; main OMNI mark is Ω (`lib/brand/omega.ts`).
- Run `npm test && npm run typecheck && npm run build` before pushing.
