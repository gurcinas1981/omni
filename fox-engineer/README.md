# FOX Autonomous Engineering & Optimisation System — v1

## Scope
A daily, **read-only** GitHub inventory covering OMNI, NEXUS, ORBIT, Land IQ,
Land Search, Land Passport, FOX Atlas, Planning RADAR, Vantage and AURORA.
Workflow generates JSON and Markdown reports as GitHub Actions artifacts.

## Activation
1. Before merging, verify the fine-grained GitHub token has **Metadata: read** and **Contents: read** only,
   restricted to the named FOX repositories. Store it in the OMNI repository's Actions
   secret named `FOX_AUDIT_TOKEN`. Never paste the token into chat or commit it.
   The secret was configured and verified during the initial audit. Do not replace it unless access fails or it expires.
2. Review and approve the draft PR before merging. **Merging places the workflow on the default branch and enables the daily schedule automatically; manual dispatch is not an activation switch.**
3. After an approved merge, in OMNI > Actions > FOX Autonomous Engineering Audit, choose **Run workflow** on `main` to verify the merged version.
4. Download the `fox-engineering-audit` artifact; review findings before changes.
5. Scheduled run executes daily at 05:17 UTC (may be delayed by GitHub).

The branch push trigger is limited to audit code/workflow changes for pre-merge validation.
The schedule runs only from the default branch. The report inventories default-branch files,
so unmerged CI PRs will continue to appear as missing workflows until those PRs are merged.
The workflow performs repository metadata/tree GET requests and uploads reports; it does not
fix code, merge PRs, dispatch NEXUS tasks, send messages or deploy applications.

Offline regression checks: `python -m unittest discover -s fox-engineer -p 'test_*.py' -v`.
CI checks empty repositories, access errors, non-empty conflicts, truncated trees and complete coverage using mocks.

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
