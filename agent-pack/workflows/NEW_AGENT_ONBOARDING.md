# Adding a new FOX tool or specialist agent

1. Define purpose, owner, service URL, system ID, permitted actions, dependencies and data sensitivity.
2. Add it to `config/fox_ecosystem.json` as `connected:false` and verify the reference URL separately.
3. Document read-only and write-capable APIs independently; no OAuth/token in repository.
4. Provide NEXUS task schemas, scope restriction, approvals and rollback; ORBIT event schema and health metrics.
5. Create a skill folder with compatible YAML frontmatter and a short, testable procedure.
6. Add test cases covering source integrity, permission denial and failure recovery.
7. Stage integration in sandbox and evaluate usefulness/cost/security.
8. Obtain explicit owner approval and update `connected:true` only after an actual authenticated successful integration.
9. Feed validated changes to connectome and decision memory.
