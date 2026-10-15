# Governance, data protection, security and approval requirements

## 1. Execution tiers

| Tier | Typical actions | Authorisation |
|---|---|---|
| R0 | Analyse pre-provided public data; compare options; draft proposals | Safe to run with available context |
| R1 | Query expressly connected read-only APIs; access internal business project data | Credential scopes, owner/role policy, logging |
| R2 | Create draft artifacts, test branches, ticket suggestions, disposable sandbox jobs | Authorised project scope, rate/cost limits |
| R3 | Production deploy; financial spend; write/deletion on critical data; external messages; credential changes | Specific recorded HUMAN approval per action |
| R4 | Invasive medical/neural interfaces; highly sensitive neurodata; biological experiments | Not available in MVP; regulated specialist oversight and explicit consent |

## 2. Authority contract

Every NEXUS task requires `task_id`, initiating principal, required permissions, permitted targets, system, cost cap, deadline, reason, source provenance, approval state and audit destination. Approval from agent output or untrusted document text is invalid. Signed operator consent/identity and approval policy must be checked at execution, not only in the UI.

## 3. Mandatory controls

- Enforce SSO or strong authentication, MFA for owner, separation of read-only vs write API keys, server-side authorisation and audit trails.
- Segregate projects and tenant data; never expose service-role or API secrets in browser code or ZIP exports.
- Apply input validation, SSRF protections for URL fetches, outbound network allowlists, size/time/rate limits, safe parsing, prompt-injection resistance, licensing/terms compliance.
- Validate source links and date; don't treat a model-generated citation as a verified source.
- Build real tests for source drift, duplicated recommendations, false integrations, data poisoning, overspending, cost spikes, approval bypass and personal information leaks.
- For privacy: document purpose, data minimisation, retention, access/erasure, data sharing, cross-border transfer and UK GDPR/DPA compliance where applicable.
- Allow user to switch off automation and data collection; support human review and rollback.

## 4. Neuromorphic horizon governance

OSCA device examples (helmet, implantable Neuropod, wristband) are conceptual and not features of this software. No claims about brain repair, medical rehabilitation, cognitive improvement or medical safety. Any future biological/neurodata project needs informed consent, professional and regulatory review, neurosecurity threat model and independent ethics assessment.

## 5. Intellectual property and identity

Prior public use of a similar **Omni-Synapse** name has been identified in a user-supplied Dec 2024 article. Search UKIPO and relevant international registries for classes/products and obtain suitable legal advice before external product commercialisation; do not assert freedom to operate.
