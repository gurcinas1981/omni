# Expert counsel and multiple AI models

**Model choice must follow evaluated need**, not popularity or the illusion that more models always means better decisions.

- Initial writer: propose hypothesis based on actual evidence.
- Independent critic: review source validity, counterexamples, regulatory/commercial risk; ideally use a different model or human domain reviewer for high-stakes tasks.
- Arbiter: compare claims against the same primary-source record; label agreement and unresolved issues, never "vote" unsupported claims into facts.
- Test harness: run gold-standard FOX cases; track errors, usefulness, speed, costs and provider outages.
- Human reviewer: required for significant legal/planning valuation or production decisions.

Provider candidates to evaluate if the user has access: OpenAI, Anthropic Claude, Google Gemini, Grok, Perplexity, DeepSeek, Kimi and other emerging engines. **These are potential providers, not connected integrations.** Provider data-use policies, endpoint schemas, location, privacy and price must be separately checked.

Routing example (proposed):

```
User idea / external alert
    ↓
OMNISYNAPSE frames question, knowns, unknowns, accepted evidence
    ↓
NEXUS requests read-only domain analyses from scoped specialist agents
    ↓
Independent critiques return structured JSON and citations
    ↓
OMNISYNAPSE triangulates, validates, scores and summarises
    ↓
Human selects action → NEXUS executes only after appropriate approval
    ↓
ORBIT records outcomes → memory stores measured lesson
```

Never pass sensitive FOX documents to external providers without approval and lawful data-sharing controls.
