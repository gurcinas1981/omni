# FOX Autonomous Engineering & Optimisation System — v1

## Scope
A daily, **read-only** GitHub inventory covering OMNI, NEXUS, ORBIT, Land IQ,
Land Search, Land Passport, FOX Atlas, Planning RADAR, Vantage and AURORA.
Workflow generates JSON and Markdown reports as GitHub Actions artifacts.

## Activation
1. Review and merge the draft pull request.
2. Create a fine-grained GitHub token with **Metadata: read** and **Contents: read** only,
   restricted to the named FOX repositories. Store it in the OMNI repository's Actions
   secret named `FOX_AUDIT_TOKEN`. Never paste the token into chat or commit it.
3. In OMNI > Actions > FOX Autonomous Engineering Audit, choose **Run workflow**.
4. Download the `fox-engineering-audit` artifact; review findings before changes.
5. Scheduled run executes daily at 05:17 UTC (may be delayed by GitHub).

## Safety policy
- No writes to another repository, production database or deployment.
- No auto-merge, destructive operations, secret exports or silent permission changes.
- Proposed future fixes must use isolated branches, tests and reviewed PRs.
- Planning, valuation and density formulas need validated reference scenarios and human sign-off.
- A missing test/workflow indicator is heuristic, **not** evidence of a broken product.

## Future versions
v2: scored risk register, code-level rules, dependency graph, test health.
v3: integration telemetry into ORBIT/NEXUS with authenticated service accounts.
v4: isolated auto-fix pull requests after test coverage and approval policies are verified.
