---
name: planning-policy-radar
description: Research UK planning policy, local plans, planning applications and regulatory changes. Use for Planning Radar, call-for-sites and applications intelligence.
compatibility: Requires a host agent with authorised retrieval tools. This skill is instructional only; no live provider access is assumed.
metadata:
  owner: fox-intelligence
  version: "1.0.0"
---

# Planning Policy Radar — OMNISYNAPSE Ω skill

## Activate when
Research UK planning policy, local plans, planning applications and regulatory changes. Use for Planning Radar, call-for-sites and applications intelligence.

## Inputs and grounding
Define authority, postcode/boundary, time window, status and permissions; identify authoritative national/local source.

## Procedure
1. **DISCOVER:** Establish the precise goal, available permission scope, time horizon and reliable sources.
2. **ANALYSE:** Compare previous/current planning guidance and dates; prioritise changes likely to affect FOX sites; state geographic coverage gaps.
3. **CHALLENGE:** Require at least one alternative hypothesis or independent counterargument; label unknowns and weak source evidence.
4. **SYNTHESISE:** Connect implications to FOX ORBIT, NEXUS, Land IQ, Land Search, Planning Radar, Land Passport and Atlas as relevant.
5. **RECOMMEND:** Rank proposals with strategic value, £/effort, cognitive benefit, risk, owner decision and evidence IDs.
6. **LEARN:** Record approved outcomes in the decision log with source, date, what worked, what failed and proposed next test.

## Expected output
Change log with authority, effective/proposal date, original link, relevance, suggested FOX action.

## Execution limits
Distinguish adopted policy, consultation, guidance and proposal; no assumption of universal API coverage.

No source -> no verified fact. No approved capability -> no tool execution. If external information is inaccessible, report what is missing. See `../../architecture/GOVERNANCE.md` and `../../prompts/OMNISYNAPSE_MASTER_PROMPT.md` when present in repository; copied standalone skills may not have these paths.
