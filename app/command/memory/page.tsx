import { loadDecisions, loadCore, fmtDate } from '@/lib/data';
import ActionForm from '@/components/command/ActionForm';
import { createDecision, recordOutcome, createNote, togglePin, deleteNote } from '../actions';

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim().toLowerCase();
  const [{ decisions, notes }, { systems }] = await Promise.all([loadDecisions(), loadCore()]);
  const match = (...f: (string | null | undefined | string[])[]) => !q || f.flat().some((x) => (x ?? '').toLowerCase().includes(q));
  const ds = decisions.filter((d) => match(d.title, d.hypothesis, d.rationale, d.lessons, d.project_id, d.options));
  const ns = notes.filter((n) => match(n.title, n.body, n.tags, n.project_id));
  const projects = systems.map((s) => s.id);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Memory &amp; decisions</h1>
          <p>Institutional memory and cognitive amplification — “why did we decide that?”, expected vs observed outcomes, and the lessons that follow.</p>
        </div>
        <form className="row" role="search">
          <input name="q" defaultValue={q} placeholder="Recall… (project, idea, lesson)" aria-label="Search memory" style={{ padding: '9px 12px', borderRadius: 999, border: '1px solid var(--line)', background: 'rgba(0,0,0,.3)', color: 'inherit', minWidth: 260 }} />
          <button className="chip">Recall</button>
        </form>
      </div>

      <div className="grid g2">
        <section className="card">
          <h2>Record a decision</h2>
          <ActionForm action={createDecision} submit="Commit to ledger">
            <div className="field"><label>Decision title</label><input name="title" required maxLength={200} /></div>
            <div className="field"><label>Hypothesis — what we believe and why</label><textarea name="hypothesis" required style={{ minHeight: 70, fontFamily: 'inherit' }} /></div>
            <div className="grid g2">
              <div className="field"><label>Options (one per line)</label><textarea name="options" style={{ minHeight: 70, fontFamily: 'inherit' }} /></div>
              <div className="field"><label>Chosen option (leave blank if undecided)</label><input name="chosen_option" /><label style={{ marginTop: 6 }}>Review on</label><input name="review_on" type="date" /></div>
            </div>
            <div className="field"><label>Rationale</label><textarea name="rationale" style={{ minHeight: 60, fontFamily: 'inherit' }} /></div>
            <div className="grid g2">
              <div className="field"><label>Expected outcome</label><input name="expected_outcome" /></div>
              <div className="field">
                <label>Project</label>
                <select name="project_id" defaultValue="">
                  <option value="">Ecosystem-wide</option>
                  {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Evidence IDs (comma separated)</label><input name="evidence_ids" /></div>
          </ActionForm>
        </section>

        <section className="card">
          <h2>Working context</h2>
          <ActionForm action={createNote} submit="Save context">
            <div className="grid g2">
              <div className="field"><label>Title</label><input name="title" required maxLength={200} /></div>
              <div className="field"><label>Tags</label><input name="tags" placeholder="land-iq, pricing" /></div>
            </div>
            <div className="field"><label>Note</label><textarea name="body" required style={{ minHeight: 90, fontFamily: 'inherit' }} /></div>
            <label className="small row"><input type="checkbox" name="pinned" /> Pin to top</label>
          </ActionForm>
          <div className="grid" style={{ marginTop: 14 }}>
            {ns.length === 0 && <p className="small muted">No context notes{q ? ' match' : ' yet'}.</p>}
            {ns.map((n) => (
              <div key={n.id} className="tool">
                <div className="tool-head">
                  <span className="tool-name">{n.pinned ? '★ ' : ''}{n.title}</span>
                  <span className="row">
                    <form action={togglePin}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="pinned" value={String(n.pinned)} /><button className="chip">{n.pinned ? 'Unpin' : 'Pin'}</button></form>
                    <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><button className="chip">Delete</button></form>
                  </span>
                </div>
                <p className="tool-role" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
                <div className="row small muted">{n.tags.map((t) => <span key={t} className="pill">{t}</span>)} {fmtDate(n.created_at)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Decision ledger · {ds.length}</h2>
        {ds.length === 0 && <p className="small muted">No decisions{q ? ' match your recall' : ' recorded yet'}.</p>}
        <div className="grid">
          {ds.map((d) => (
            <details key={d.id} className="skill">
              <summary>
                <span>
                  <strong>{d.title}</strong> <span className="small muted">· {d.project_id ?? 'ecosystem'} · {fmtDate(d.created_at)}</span>
                </span>
                <span className="row">
                  {d.approved_by_human ? <span className="pill pill-ok">Decided by owner</span> : <span className="pill pill-gold">Open</span>}
                  {d.observed_outcome ? <span className="pill pill-cyan">Outcome logged</span> : null}
                </span>
              </summary>
              <div className="grid g2" style={{ marginTop: 10 }}>
                <div className="small" style={{ lineHeight: 1.6 }}>
                  <p><strong>Hypothesis.</strong> {d.hypothesis}</p>
                  {d.options.length > 0 && <p><strong>Options.</strong> {d.options.join(' · ')}</p>}
                  {d.chosen_option && <p><strong>Chosen.</strong> {d.chosen_option}</p>}
                  {d.rationale && <p><strong>Why.</strong> {d.rationale}</p>}
                  {d.expected_outcome && <p><strong>Expected.</strong> {d.expected_outcome}</p>}
                  {d.review_on && <p><strong>Review on.</strong> {d.review_on}</p>}
                  {d.evidence_ids.length > 0 && <p className="mono">Evidence: {d.evidence_ids.join(', ')}</p>}
                </div>
                <ActionForm action={recordOutcome} submit="Save outcome" variant="btn btn-ghost">
                  <input type="hidden" name="id" value={d.id} />
                  <div className="field"><label>Observed outcome</label><textarea name="observed_outcome" defaultValue={d.observed_outcome ?? ''} style={{ minHeight: 60, fontFamily: 'inherit' }} /></div>
                  <div className="field"><label>Lessons</label><textarea name="lessons" defaultValue={d.lessons ?? ''} style={{ minHeight: 60, fontFamily: 'inherit' }} /></div>
                </ActionForm>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
