---
name: cybersecurity-governance
description: Audit threat models, UK privacy, permissions and safe agent autonomy. Use for NEXUS tools, ORBIT integrations and sensitive data.
compatibility: Requires a host agent with authorised retrieval tools. This skill is instructional only; no live provider access is assumed.
metadata:
  owner: fox-intelligence
  version: "1.0.0"
---

# Cybersecurity Governance — OMNISYNAPSE Ω skill

## Activate when
Audit threat models, UK privacy, permissions and safe agent autonomy. Use for NEXUS tools, ORBIT integrations and sensitive data.

## Inputs and grounding
Identify asset, actor, threat, least-privilege permissions, credentials, data class and attack surface.

## Procedure
1. **DISCOVER:** Establish the precise goal, available permission scope, time horizon and reliable sources.
2. **ANALYSE:** Review injection, SSRF, data exfiltration, logging, approval bypass, token rotation, cross-tenant leaks and rollback.
3. **CHALLENGE:** Require at least one alternative hypothesis or independent counterargument; label unknowns and weak source evidence.
4. **SYNTHESISE:** Connect implications to FOX ORBIT, NEXUS, Land IQ, Land Search, Planning Radar, Land Passport and Atlas as relevant.
5. **RECOMMEND:** Rank proposals with strategic value, £/effort, cognitive benefit, risk, owner decision and evidence IDs.
6. **LEARN:** Record approved outcomes in the decision log with source, date, what worked, what failed and proposed next test.

## Expected output
Risk register with severity, proof, controls, accountable role and action gate.

## Execution limits
High-risk writes always require authenticated owner approval; never expose credentials.

No source -> no verified fact. No approved capability -> no tool execution. If external information is inaccessible, report what is missing. See `../../architecture/GOVERNANCE.md` and `../../prompts/OMNISYNAPSE_MASTER_PROMPT.md` when present in repository; copied standalone skills may not have these paths.
