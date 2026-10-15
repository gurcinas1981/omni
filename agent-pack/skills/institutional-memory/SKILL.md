---
name: institutional-memory
description: Store and retrieve decision histories, wins, failures, assumptions and outcomes. Use for project retrospectives and why-did-we-decide questions.
compatibility: Requires a host agent with authorised retrieval tools. This skill is instructional only; no live provider access is assumed.
metadata:
  owner: fox-intelligence
  version: "1.0.0"
---

# Institutional Memory — OMNISYNAPSE Ω skill

## Activate when
Store and retrieve decision histories, wins, failures, assumptions and outcomes. Use for project retrospectives and why-did-we-decide questions.

## Inputs and grounding
Collect an event, timestamp, actor/scope, evidence and consented source; separate hypothesis, decision and actual outcome.

## Procedure
1. **DISCOVER:** Establish the precise goal, available permission scope, time horizon and reliable sources.
2. **ANALYSE:** Deduplicate; add corrections with immutable trail; search for comparable historical projects; identify repeated errors.
3. **CHALLENGE:** Require at least one alternative hypothesis or independent counterargument; label unknowns and weak source evidence.
4. **SYNTHESISE:** Connect implications to FOX ORBIT, NEXUS, Land IQ, Land Search, Planning Radar, Land Passport and Atlas as relevant.
5. **RECOMMEND:** Rank proposals with strategic value, £/effort, cognitive benefit, risk, owner decision and evidence IDs.
6. **LEARN:** Record approved outcomes in the decision log with source, date, what worked, what failed and proposed next test.

## Expected output
Evidence-linked decision log or retrospective including verified lessons and confidence.

## Execution limits
Do not invent absent historic records; apply retention controls and PII minimisation.

No source -> no verified fact. No approved capability -> no tool execution. If external information is inaccessible, report what is missing. See `../../architecture/GOVERNANCE.md` and `../../prompts/OMNISYNAPSE_MASTER_PROMPT.md` when present in repository; copied standalone skills may not have these paths.
