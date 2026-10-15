import { loadCore, loadOrbit, fmtDate } from '@/lib/data';

const pill = (s: string) => (s === 'READ_ONLY_VERIFIED' || s === 'WRITE_SCOPED' ? 'pill-ok' : s === 'DEGRADED' || s === 'FAILED' ? 'pill-warn' : '');

export default async function SystemsPage() {
  const [{ systems }, events] = await Promise.all([loadCore(), loadOrbit()]);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>FOX systems</h1>
          <p>Registry of the ecosystem. A URL is a destination, not a connection — status changes only when a verified adapter records evidence.</p>
        </div>
      </div>
      <section className="card">
        <h2>Registry</h2>
        <table className="table">
          <thead><tr><th>System</th><th>Layer</th><th>Destination</th><th>Connection</th><th>Last verified</th></tr></thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong><div className="small muted">{s.description}</div></td>
                <td className="small">{s.category}</td>
                <td className="small">{s.reference_url ? <a href={s.reference_url} target="_blank" rel="noopener noreferrer">{new URL(s.reference_url).hostname}</a> : '—'}</td>
                <td><span className={`pill ${pill(s.connection_status)}`}><i className={`led ${pill(s.connection_status) === 'pill-ok' ? 'led-on' : 'led-off'}`} />{s.connection_status.replace(/_/g, ' ')}</span></td>
                <td className="small">{fmtDate(s.last_verified)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>ORBIT telemetry inbox</h2>
        {events.length === 0 ? (
          <p className="small muted">No observed events. Missing telemetry is reported as <strong>unknown</strong>, never as “healthy”. The read-only ORBIT adapter is the next milestone.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Observed</th><th>Event</th><th>Source</th><th>Status</th><th>Confidence</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.event_id}><td className="small">{fmtDate(e.observed_at)}</td><td>{e.event_type}</td><td>{e.source_system}</td><td>{e.status ?? '—'}</td><td>{e.confidence ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
