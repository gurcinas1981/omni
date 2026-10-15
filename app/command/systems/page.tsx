import { loadCore, loadOrbit, fmtDate } from '@/lib/data';
import { maybeSyncOrbit, orbitConfigured, AUTO_SYNC_MINUTES } from '@/lib/integrations/orbit';
import { latestHealthBySystem } from '@/lib/integrations/orbitMap';
import ActionForm from '@/components/command/ActionForm';
import { syncOrbitNow } from '../actions';

export const dynamic = 'force-dynamic';

const pill = (s: string) => (s === 'READ_ONLY_VERIFIED' || s === 'WRITE_SCOPED' ? 'pill-ok' : s === 'DEGRADED' || s === 'FAILED' ? 'pill-warn' : '');
const healthPill = (s: string | null) => (s === 'up' ? 'pill-ok' : s === 'degraded' || s === 'down' ? 'pill-warn' : '');
const m = (e: { metrics: Record<string, unknown> }, k: string) => {
  const v = e.metrics?.[k];
  return v === null || v === undefined || v === '' ? null : String(v);
};

export default async function SystemsPage() {
  let { systems } = await loadCore();
  const orbitRow = systems.find((s) => s.id === 'fox-orbit');
  const auto = await maybeSyncOrbit(orbitRow?.updated_at);
  if (auto) ({ systems } = await loadCore());
  const events = await loadOrbit(150);
  const health = latestHealthBySystem(events);
  const orbit = systems.find((s) => s.id === 'fox-orbit');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>FOX systems</h1>
          <p>
            Connection = OMNI’s own verified adapter. Health = what ORBIT measured, shown with its time. A URL alone is a destination, never a connection.
          </p>
        </div>
      </div>

      <section className="card" aria-labelledby="orbit-h">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 id="orbit-h">ORBIT read-only adapter</h2>
            <p className="small" style={{ margin: '4px 0' }}>
              <span className={`pill ${pill(orbit?.connection_status ?? '')}`}>
                <i className={`led ${pill(orbit?.connection_status ?? '') === 'pill-ok' ? 'led-on' : 'led-off'}`} />
                {(orbit?.connection_status ?? 'UNCONNECTED').replace(/_/g, ' ')}
              </span>{' '}
              last verified {fmtDate(orbit?.last_verified)}
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              {orbit?.verification_evidence ||
                (orbitConfigured() ? 'Not yet read.' : 'ORBIT_READ_TOKEN is not configured on this deployment, so nothing is read.')}
            </p>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              GET <code>/api/observability</code> (<code>fox.observability.snapshot.v1</code>) with a dedicated bearer, server-side only. Refreshes when you open this page and the last attempt is
              older than {AUTO_SYNC_MINUTES} minutes.
            </p>
          </div>
          <ActionForm action={syncOrbitNow} submit="Sync from ORBIT now" variant="btn btn-ghost" />
        </div>
        {auto && !auto.ok && <p className="error small">Automatic refresh failed: {auto.message}</p>}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Registry</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>System</th>
                <th>Destination</th>
                <th>OMNI connection</th>
                <th>Health via ORBIT</th>
                <th>Observed</th>
              </tr>
            </thead>
            <tbody>
              {systems.map((s) => {
                const h = health.get(s.id);
                const lat = h ? m(h, 'latency_ms') : null;
                const code = h ? m(h, 'http_status') : null;
                return (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <div className="small muted">{s.description}</div>
                    </td>
                    <td className="small">
                      {s.reference_url ? (
                        <a href={s.reference_url} target="_blank" rel="noopener noreferrer">
                          {new URL(s.reference_url).hostname}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`pill ${pill(s.connection_status)}`}>
                        <i className={`led ${pill(s.connection_status) === 'pill-ok' ? 'led-on' : 'led-off'}`} />
                        {s.connection_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="small">
                      {h ? (
                        <>
                          <span className={`pill ${healthPill(h.status)}`}>{h.status ?? 'unknown'}</span>{' '}
                          {code && code !== '0' ? `HTTP ${code}` : m(h, 'reason') ?? ''}
                          {lat ? ` · ${lat} ms` : ''}
                        </>
                      ) : (
                        <span className="muted">unknown — not measured</span>
                      )}
                    </td>
                    <td className="small">{h ? fmtDate(h.observed_at) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>ORBIT telemetry inbox</h2>
        {events.length === 0 ? (
          <p className="small muted">No observed events. Missing telemetry is reported as <strong>unknown</strong>, never as “healthy”.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Observed</th>
                  <th>Event</th>
                  <th>System</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 80).map((e) => (
                  <tr key={e.event_id}>
                    <td className="small">{fmtDate(e.observed_at)}</td>
                    <td className="small">{e.event_type.replace(/_/g, ' ')}</td>
                    <td className="small">{e.project_id ?? '—'}</td>
                    <td className="small">{e.status ?? '—'}</td>
                    <td className="small muted">
                      {e.event_type === 'deployment_observed'
                        ? [m(e, 'vercel_project'), m(e, 'commit_sha')?.slice(0, 7)].filter(Boolean).join(' · ')
                        : [m(e, 'http_status') && m(e, 'http_status') !== '0' ? `HTTP ${m(e, 'http_status')}` : m(e, 'reason'), m(e, 'latency_ms') ? `${m(e, 'latency_ms')} ms` : null]
                            .filter(Boolean)
                            .join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
