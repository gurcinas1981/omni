import { loadAudit, fmtDate } from '@/lib/data';
import { getOwner } from '@/lib/supabase/server';

export default async function AuditPage() {
  const [rows, owner] = await Promise.all([loadAudit(300), getOwner()]);
  const who = (a: string) => (a === owner?.userId ? 'You' : a === 'system' ? 'System' : a.slice(0, 8) + '…');
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p>Append-only. Updates and deletes are blocked at the database. Most recent 300 events.</p>
        </div>
      </div>
      <section className="card">
        <table className="table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Resource</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="small">{fmtDate(r.at)}</td>
                <td>{who(r.actor)}</td>
                <td><span className="pill">{r.action}</span></td>
                <td className="small"><span className="muted">{r.resource_type}</span> · <span className="mono">{r.resource_id}</span></td>
                <td className="mono small">{Object.keys(r.extra ?? {}).length ? JSON.stringify(r.extra) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
