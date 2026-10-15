import Link from 'next/link';
import { loadCore, loadTasks, fmtDate } from '@/lib/data';
import { scoreRecommendation, TRANSITIONS, SCORE_FIELDS, TRUSTED, type RecStatus } from '@/lib/engine/core';
import { SCORING, COUNCIL } from '@/lib/registry/council';
import ActionForm from '@/components/command/ActionForm';
import { transitionRecommendation, proposeNexusTask } from '../actions';

const LABEL: Partial<Record<RecStatus, string>> = {
  reviewed: 'Mark reviewed',
  approved: 'Approve',
  rejected: 'Reject',
  proposed: 'Return to proposed',
  queued: 'Queue for NEXUS',
  running: 'Mark running',
  verified_complete: 'Verified complete',
  failed: 'Mark failed',
  rolled_back: 'Rolled back',
};
const VARIANT: Partial<Record<RecStatus, 'btn' | 'btn btn-ghost' | 'btn btn-ok' | 'btn btn-danger'>> = {
  approved: 'btn btn-ok',
  rejected: 'btn btn-danger',
  failed: 'btn btn-danger',
};
const statusPill = (s: string) =>
  s === 'approved' || s === 'verified_complete' ? 'pill-ok' : s === 'rejected' || s === 'failed' || s === 'rolled_back' ? 'pill-warn' : s === 'reviewed' ? 'pill-cyan' : 'pill-gold';

export default async function Approvals({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demo = (await searchParams).demo !== '0';
  const [{ recs, evidence }, tasks] = await Promise.all([loadCore(), loadTasks()]);
  const evById = new Map(evidence.map((e) => [e.id, e]));
  const list = recs
    .filter((r) => demo || !r.demo)
    .map((r) => ({ r, score: scoreRecommendation(r, SCORING.weights) }))
    .sort((a, b) => b.score - a.score);
  const cell = (id?: string | null) => COUNCIL.find((c) => c.id === id)?.title ?? 'Unassigned';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Approval queue</h1>
          <p>proposed → reviewed → approved → queued → running → verified complete. Only you can approve; the database rejects anything else.</p>
        </div>
        <div className="row">
          <Link className={`chip ${demo ? 'chip-gold' : ''}`} href="/command/approvals">
            Include demo
          </Link>
          <Link className={`chip ${!demo ? 'chip-gold' : ''}`} href="/command/approvals?demo=0">
            Live only
          </Link>
        </div>
      </div>
      {list.length === 0 && <div className="card">No recommendations yet. Ingest cited proposals on the Evidence page.</div>}
      <div className="grid">
        {list.map(({ r, score }) => {
          const sources = r.evidence_ids.map((id) => evById.get(id)).filter(Boolean);
          const trusted = sources.some((s) => s && TRUSTED.has(s.classification));
          return (
            <article key={r.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="row">
                  <span className={`pill ${statusPill(r.status)}`}>{r.status.replace('_', ' ')}</span>
                  <span className="pill">{r.risk_tier}</span>
                  {r.demo && <span className="pill pill-demo">DEMO</span>}
                  {!trusted && <span className="pill pill-warn">No trusted source — cannot enter brief</span>}
                  <span className="pill">{cell(r.council_cell)}</span>
                </div>
                <span className="small muted">Relative score {score.toFixed(0)} · updated {fmtDate(r.updated_at)}</span>
              </div>
              <h3 style={{ marginTop: 10 }}>{r.title}</h3>
              <p style={{ margin: '0 0 8px', lineHeight: 1.55 }}>{r.summary}</p>
              <p className="small muted" style={{ margin: '0 0 12px' }}>
                Impacts {r.impacted_systems.join(', ') || '—'} · Cognitive benefit: {r.cognitive_benefit} · Effort: {r.estimated_effort} ·{' '}
                {r.cost_gbp != null ? `£${r.cost_gbp.toLocaleString('en-GB')} indicative` : 'cost unverified'}
              </p>
              <div className="grid g2">
                <div className="score-bars" aria-label="Score breakdown">
                  {SCORE_FIELDS.map((k) => {
                    const v = r.scores[k] ?? 0;
                    const neg = (SCORING.weights[k] ?? 0) < 0;
                    return (
                      <div key={k} style={{ display: 'contents' }}>
                        <span className="muted">{k.replace(/_/g, ' ')}</span>
                        <span className={`bar ${neg ? 'neg' : ''}`}>
                          <i style={{ width: `${(v / 5) * 100}%` }} />
                        </span>
                        <span>{v}</span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <p className="small" style={{ marginTop: 0 }}>
                    <strong>Evidence</strong>
                  </p>
                  <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                    {r.evidence_ids.map((id) => {
                      const e = evById.get(id);
                      return (
                        <li key={id}>
                          {e ? (
                            <>
                              <a href={e.source_url} target="_blank" rel="noopener noreferrer">
                                {e.title}
                              </a>{' '}
                              <span className="muted">({e.classification.replace('_', ' ')}, {Math.round(e.confidence * 100)}%)</span>
                            </>
                          ) : (
                            <span className="error">{id} — not in ledger</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {r.approval_note && <p className="notice">Note: {r.approval_note}</p>}
                </div>
              </div>
              {TRANSITIONS[r.status].length > 0 && (
                <div className="row" style={{ marginTop: 14, alignItems: 'flex-start' }}>
                  {TRANSITIONS[r.status].map((to) => (
                    <ActionForm
                      key={to}
                      action={transitionRecommendation}
                      submit={LABEL[to] ?? to}
                      variant={VARIANT[to] ?? 'btn btn-ghost'}
                      className="inline-form"
                      confirm={to === 'approved' ? `Approve “${r.title}”? This records your authority (risk ${r.risk_tier}).` : undefined}
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="to" value={to} />
                      {(to === 'approved' || to === 'rejected') && (
                        <input name="note" placeholder={to === 'approved' ? 'Approval note (optional)' : 'Reason (optional)'} maxLength={1000} className="note-input" aria-label="Decision note" />
                      )}
                    </ActionForm>
                  ))}
                </div>
              )}
              {r.status === 'approved' && (
                <details style={{ marginTop: 12 }}>
                  <summary className="small">Prepare NEXUS task proposal</summary>
                  <ActionForm action={proposeNexusTask} submit="Hold task proposal" variant="btn btn-ghost">
                    <input type="hidden" name="recommendation_id" value={r.id} />
                    <div className="grid g3">
                      <div className="field"><label>Intent</label><input name="intent" placeholder="inspect_repo_health" /></div>
                      <div className="field"><label>Scope</label><input name="scope" placeholder="read:repo_metadata" /></div>
                      <div className="field"><label>Max cost (£)</label><input name="max_cost_gbp" type="number" min="0" step="0.5" defaultValue="1" /></div>
                    </div>
                  </ActionForm>
                </details>
              )}
            </article>
          );
        })}
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>NEXUS task proposals</h2>
        {tasks.length === 0 ? (
          <p className="small muted">None. Approved recommendations can be turned into bounded proposals; they stay held until a verified NEXUS adapter exists.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Created</th><th>Intent</th><th>Scope</th><th>Risk</th><th>Cap</th><th>Status</th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.task_id}>
                  <td>{fmtDate(t.created_at)}</td><td>{t.intent}</td><td className="mono">{t.scope}</td><td>{t.risk_tier}</td>
                  <td>£{Number(t.max_cost_gbp).toFixed(2)}</td><td><span className="pill pill-warn">{t.dispatch_status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
