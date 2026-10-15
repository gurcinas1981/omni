import { COUNCIL, COUNCIL_NOTICE, SKILLS, SKILL_CELL, SKILL_RUNTIME, FEEDS } from '@/lib/registry/council';

const RUNTIME_LABEL = { instruction_only: 'Instruction skill · not yet executing', scheduled: 'Scheduled', running: 'Running' } as const;

function SkillCard({ id }: { id: string }) {
  const s = SKILLS.find((k) => k.id === id)!;
  return (
    <details className="skill">
      <summary>
        <span><strong>{s.name}</strong><span className="small muted"> — {s.description}</span></span>
        <span className="pill pill-warn">{RUNTIME_LABEL[SKILL_RUNTIME[s.id]]}</span>
      </summary>
      <pre>{s.body}</pre>
    </details>
  );
}

export default function CouncilPage() {
  const supervisory = SKILLS.filter((s) => SKILL_CELL[s.id] === 'omnisynapse');
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Expert council</h1>
          <p>Eight disciplines and {SKILLS.length} specialist skills. Signal-driven activation: light checks daily, deep specialist work only when something material changes.</p>
        </div>
      </div>
      <p className="notice" style={{ marginBottom: 16 }}>
        Honest status: these are versioned instruction skills from the agent pack, ready to load into a host runtime. None is yet running as an independent AI professional — specialist execution workflows are the next implementation stage. {COUNCIL_NOTICE}
      </p>
      <section className="card" style={{ marginBottom: 16 }}>
        <h2>OMNISYNAPSE supervisory functions</h2>
        <div className="grid">{supervisory.map((s) => <SkillCard key={s.id} id={s.id} />)}</div>
      </section>
      <div className="grid g2">
        {COUNCIL.map((c) => {
          const skills = SKILLS.filter((s) => SKILL_CELL[s.id] === c.id);
          return (
            <section key={c.id} className="card">
              <h2>{c.title}</h2>
              <p className="small" style={{ marginTop: 0 }}>{c.roles.join(' · ')}</p>
              <p className="notice"><strong>Standing challenge:</strong> {c.challenge}</p>
              <div className="grid" style={{ marginTop: 10 }}>
                {skills.length ? skills.map((s) => <SkillCard key={s.id} id={s.id} />) : <p className="small muted">Uses the shared council skills.</p>}
              </div>
            </section>
          );
        })}
      </div>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>Watch sources</h2>
        <p className="small muted" style={{ marginTop: 0 }}>{FEEDS.policy}</p>
        <table className="table">
          <thead><tr><th>Feed</th><th>Domain</th><th>Status</th></tr></thead>
          <tbody>
            {FEEDS.feeds.map((f) => (
              <tr key={f.id}><td className="mono">{f.url}</td><td>{f.domain}</td><td><span className="pill pill-warn">{f.enabled ? 'Enabled' : 'Disabled until validated'}</span></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
