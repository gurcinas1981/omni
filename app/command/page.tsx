import Link from 'next/link';
import { loadCore, fmtDate } from '@/lib/data';
import { buildBrief, TRUSTED } from '@/lib/engine/core';
import { SCORING } from '@/lib/registry/council';
import { INTELLIGENCE_CYCLE } from '@/lib/registry/nodes';
import Markdown from '@/components/command/Markdown';

export default async function BriefPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const sp = await searchParams;
  const demo = sp.demo === '1';
  const { evidence, recs, systems, error } = await loadCore();
  const brief = buildBrief({ recs, evidence, systems, includeDemo: demo, weights: SCORING.weights });
  const trusted = evidence.filter((e) => TRUSTED.has(e.classification) && (demo || !e.demo)).length;
  const awaiting = recs.filter((r) => (r.status === 'proposed' || r.status === 'reviewed') && (demo || !r.demo)).length;
  const approved = recs.filter((r) => r.status === 'approved' && (demo || !r.demo)).length;
  const orbit = systems.find((s) => s.id === 'fox-orbit');
  const orbitOk = orbit?.connection_status === 'READ_ONLY_VERIFIED';
  const verified = systems.filter((s) => s.connection_status === 'READ_ONLY_VERIFIED' || s.connection_status === 'WRITE_SCOPED').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Daily executive intelligence</h1>
          <p>
            {brief.date} · {demo ? 'Demonstration data included' : 'Sourced records only'} · fewer than three items are shown when evidence is insufficient
          </p>
        </div>
        <div className="row">
          <Link className={`chip ${!demo ? 'chip-gold' : ''}`} href="/command">
            Evidence mode
          </Link>
          <Link className={`chip ${demo ? 'chip-gold' : ''}`} href="/command?demo=1">
            Demo mode
          </Link>
        </div>
      </div>
      {error && <p className="error">Data error: {error}</p>}

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card" data-explain="stat-trusted">
          <div className="stat">{trusted}</div>
          <div className="stat-label">Trusted evidence records</div>
        </div>
        <div className="card" data-explain="stat-awaiting">
          <div className="stat">{awaiting}</div>
          <div className="stat-label">Proposals awaiting your review</div>
        </div>
        <div className="card" data-explain="stat-approved">
          <div className="stat">{approved}</div>
          <div className="stat-label">Human-approved, not yet dispatched</div>
        </div>
        <div className="card" data-explain="stat-systems">
          <div className="stat">
            {verified}/{systems.length}
          </div>
          <div className="stat-label">FOX systems with verified connections</div>
        </div>
      </div>

      <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
        <section className="card" aria-labelledby="brief-h">
          <h2 id="brief-h">Today’s brief</h2>
          <Markdown source={brief.markdown} />
          <details>
            <summary className="small muted">Copy as markdown</summary>
            <textarea readOnly className="mono" style={{ width: '100%', minHeight: 200, background: 'rgba(0,0,0,.3)', color: 'inherit', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: 8 }} defaultValue={brief.markdown} />
          </details>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn" href="/command/approvals">
              Review proposals
            </Link>
            <Link className="btn btn-ghost" href="/command/evidence">
              Add evidence
            </Link>
          </div>
        </section>

        <div className="grid">
          <section className="card">
            <h2>Intelligence cycle</h2>
            <ol className="cycle">
              {INTELLIGENCE_CYCLE.map((c) => (
                <li key={c.n}>
                  <span>{c.n}</span>
                  <strong>{c.name}</strong>
                  <em>{c.text}</em>
                </li>
              ))}
            </ol>
            <p className="small muted">Stages 01–04 run inside specialist workflows once connected; today OMNISYNAPSE performs 05 Recommend and 06 Learn over records you ingest.</p>
          </section>
          <section className="card">
            <h2>Connections</h2>
            <h3>Ground recommendations in real FOX activity</h3>
            <ol className="small" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
              <li>
                ORBIT read-only adapter → <code>orbit_events</code> —{' '}
                {orbitOk ? <strong>verified {fmtDate(orbit?.last_verified)}</strong> : <span>{(orbit?.connection_status ?? 'UNCONNECTED').replace(/_/g, ' ').toLowerCase()}</span>}
              </li>
              <li>NEXUS authorised task interface → proposals held until NEXUS exposes a proposal endpoint</li>
              <li>Persistent decision memory — <strong>live</strong> (decision ledger &amp; context)</li>
            </ol>
            <p className="small">
              <span className={`pill ${orbitOk ? 'pill-ok' : 'pill-warn'}`}>ORBIT {orbitOk ? 'read verified' : 'not verified'}</span>{' '}
              <span className="pill pill-warn">NEXUS held</span> <span className="pill pill-ok">Memory live</span>
            </p>
            <Link className="small" href="/command/systems">
              Open systems &amp; ORBIT telemetry →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
