import { getOwner } from '@/lib/supabase/server';
import ActionForm from '@/components/command/ActionForm';
import { changePassword } from '../actions';

const TIERS = [
  ['R0', 'Analyse supplied/public data, compare options, draft proposals', 'Runs with available context'],
  ['R1', 'Query connected read-only APIs, internal project data', 'Scoped credentials, owner policy, logging'],
  ['R2', 'Draft artefacts, test branches, sandbox jobs', 'Authorised scope, rate and cost limits'],
  ['R3', 'Production deploy, spend, critical writes/deletes, external messages, credential changes', 'Specific recorded human approval per action'],
  ['R4', 'Invasive neural interfaces, sensitive neurodata, biological experiments', 'Not available in this service'],
];

export default async function GovernancePage() {
  const owner = await getOwner();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Governance</h1>
          <p>Hierarchy, authority and the controls that keep OMNISYNAPSE an advisor rather than an unsupervised operator.</p>
        </div>
      </div>
      <div className="grid g2">
        <section className="card">
          <h2>Hierarchy</h2>
          <div className="hier">
            <div className="lvl"><strong>Visionary Innovator</strong> — final authority: approvals, budget, deployment, external communication</div>
            <div className="lvl" style={{ marginLeft: 16 }}><strong>OMNISYNAPSE Ω</strong> — strategy, evidence integration, cognitive amplification, recommendations</div>
            <div className="lvl" style={{ marginLeft: 32 }}><strong>ORBIT</strong> (read-only observability) · <strong>NEXUS</strong> (governed execution)</div>
            <div className="lvl" style={{ marginLeft: 48 }}><strong>Expert council</strong> — 8 disciplines · 17 skills</div>
            <div className="lvl" style={{ marginLeft: 64 }}><strong>FOX platforms</strong> — Land IQ · LandSearch · Planning Radar · Land Passport · FOX Atlas</div>
          </div>
          <p className="small muted">Recommendation ≠ approval ≠ execution ≠ evidence of success. OMNISYNAPSE cannot approve its own proposals.</p>
        </section>
        <section className="card">
          <h2>Risk tiers</h2>
          <table className="table">
            <thead><tr><th>Tier</th><th>Typical actions</th><th>Authorisation</th></tr></thead>
            <tbody>{TIERS.map(([t, a, z]) => <tr key={t}><td><strong>{t}</strong></td><td className="small">{a}</td><td className="small">{z}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="card">
          <h2>Enforced controls</h2>
          <ul className="small" style={{ lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
            <li>Owner-only row-level security on every table; anonymous access has no grants</li>
            <li>Approval state machine enforced by a Postgres trigger — no skip-review, no agent approvals, R4 blocked</li>
            <li>Append-only audit ledger (updates/deletes rejected)</li>
            <li>No service-role or API secrets in this application — all queries run as you</li>
            <li>Source URLs validated (http/https only, no embedded credentials); untrusted evidence cannot promote a recommendation</li>
            <li>NEXUS task proposals are held until a verified adapter exists — nothing is dispatched</li>
            <li>Security headers, no indexing, no caching of private pages</li>
          </ul>
        </section>
        <section className="card" id="account">
          <h2>Account</h2>
          <p className="small">Signed in as <strong>{owner?.email}</strong> ({owner?.role}).</p>
          {owner?.mustChangePassword && <p className="notice" style={{ color: 'var(--amber)' }}>You are using the temporary password issued at setup. Replace it now.</p>}
          <ActionForm action={changePassword} submit="Update password">
            <div className="field"><label htmlFor="pw">New password (14+ characters)</label><input id="pw" name="password" type="password" autoComplete="new-password" minLength={14} required /></div>
            <div className="field"><label htmlFor="pw2">Confirm</label><input id="pw2" name="confirm" type="password" autoComplete="new-password" minLength={14} required /></div>
          </ActionForm>
          <p className="small muted">Privacy: OMNISYNAPSE stores only what you record. No behavioural, biometric or neurodata is collected.</p>
        </section>
      </div>
    </>
  );
}
