---
name: agent-evaluation
description: Design regression tests and monitoring for specialist agents. Use when assessing AI quality, hallucination risk, costs and improvement claims.
compatibility: Requires a host agent with authorised retrieval tools. This skill is instructional only; no live provider access is assumed.
metadata:
  owner: fox-intelligence
  version: "1.0.0"
---

# Agent Evaluation — OMNISYNAPSE Ω skill

## Activate when
Design regression tests and monitoring for specialist agents. Use when assessing AI quality, hallucination risk, costs and improvement claims.

## Inputs and grounding
Select representative ground-truth tasks, authorised data and baselines with benchmark freeze.

## Procedure
1. **DISCOVER:** Establish the precise goal, available permission scope, time horizon and reliable sources.
2. **ANALYSE:** Measure factual grounding, citation correctness, autonomy safety, task success, latency, token costs and usefulness; inspect failures.
3. **CHALLENGE:** Require at least one alternative hypothesis or independent counterargument; label unknowns and weak source evidence.
4. **SYNTHESISE:** Connect implications to FOX ORBIT, NEXUS, Land IQ, Land Search, Planning Radar, Land Passport and Atlas as relevant.
5. **RECOMMEND:** Rank proposals with strategic value, £/effort, cognitive benefit, risk, owner decision and evidence IDs.
6. **LEARN:** Record approved outcomes in the decision log with source, date, what worked, what failed and proposed next test.

## Expected output
Evaluation scorecard, confidence intervals where justified and release/rollback recommendation.

## Execution limits
Do not claim intelligence increase from model self-assessment alone.

No source -> no verified fact. No approved capability -> no tool execution. If external information is inaccessible, report what is missing. See `../../architecture/GOVERNANCE.md` and `../../prompts/OMNISYNAPSE_MASTER_PROMPT.md` when present in repository; copied standalone skills may not have these paths.
