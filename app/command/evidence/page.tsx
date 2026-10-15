import { loadCore, fmtDate } from '@/lib/data';
import ActionForm from '@/components/command/ActionForm';
import { ingestJson, deleteEvidence } from '../actions';

const EXAMPLE = JSON.stringify(
  {
    kind: 'evidence',
    records: [
      {
        id: 'ev-2026-10-15-planning-data',
        title: 'Planning Data platform — dataset documentation',
        summary: 'What changed and why it matters to FOX, in one or two sentences.',
        source_url: 'https://www.planning.data.gov.uk/docs',
        published_at: null,
        observed_at: '2026-10-15T09:00:00+01:00',
        classification: 'verified_primary',
        project_id: 'fox-land-iq',
        confidence: 0.8,
        demo: false,
      },
    ],
  },
  null,
  2,
);

const pill = (c: string) => (c === 'verified_primary' || c === 'internal_verified' ? 'pill-ok' : c === 'credible_secondary' ? 'pill-cyan' : 'pill-warn');

export default async function EvidencePage() {
  const { evidence } = await loadCore();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Evidence ledger</h1>
          <p>Dated, linked and classified sources. Only verified primary, credible secondary or internal verified evidence can promote a recommendation.</p>
        </div>
      </div>
      <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)' }}>
        <section className="card">
          <h2>Ledger · {evidence.length} records</h2>
          <table className="table">
            <thead>
              <tr><th>Source</th><th>Class</th><th>Project</th><th>Observed</th><th /></tr>
            </thead>
            <tbody>
              {evidence.map((e) => (
                <tr key={e.id}>
                  <td>
                    <a href={e.source_url} target="_blank" rel="noopener noreferrer">{e.title}</a>
                    {e.demo && <> <span className="pill pill-demo">DEMO</span></>}
                    <div className="small muted">{e.summary}</div>
                    <div className="mono muted">{e.id}</div>
                  </td>
                  <td><span className={`pill ${pill(e.classification)}`}>{e.classification.replace('_', ' ')}</span><div className="small muted">{Math.round(e.confidence * 100)}%</div></td>
                  <td className="small">{e.project_id}</td>
                  <td className="small">{fmtDate(e.observed_at)}</td>
                  <td>
                    <form action={deleteEvidence}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="chip" aria-label={`Delete ${e.title}`}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h2>Ingest records</h2>
          <p className="small muted" style={{ marginTop: 0 }}>
            Paste JSON matching <code>agent-pack/schemas</code> — <code>kind</code> is <code>evidence</code> or <code>recommendation</code>; max 200 records. URLs with credentials or non-http schemes are rejected. Recommendations always enter as <em>proposed</em>.
          </p>
          <ActionForm action={ingestJson} submit="Validate & ingest">
            <div className="field">
              <label htmlFor="payload">JSON payload</label>
              <textarea id="payload" name="payload" defaultValue={EXAMPLE} style={{ minHeight: 360 }} spellCheck={false} />
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
