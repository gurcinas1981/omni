import { describe, it, expect } from 'vitest';
import { mapOrbitSnapshot, describeSync, latestHealthBySystem, OrbitSnapshotError } from '@/lib/integrations/orbitMap';
import { buildEnvelope, sign, verify, checkDispatchable, interpretReply, ProposalError, type TaskRow } from '@/lib/integrations/nexusContract';

const URL_ = 'https://ecosystem.foxintelligence.co.uk/api/observability';
const snapshot = () => ({
  schema: 'fox.observability.snapshot.v1',
  observed_at: '2026-10-15T15:00:00.000Z',
  summary: { sites_checked: 3, sites_up: 2, sites_degraded: 0, sites_down: 1, p0_alerts: ['radar'], http_p50_ms: 120, http_p95_ms: 400 },
  sites: [
    { id: 'orbit', url: 'https://ecosystem.foxintelligence.co.uk/', access: 'private', state: 'up', severity: null, http_status: 200, latency_ms: 95, measured_at: '2026-10-15T15:00:01.000Z' },
    { id: 'pilot', state: 'up', http_status: 200, latency_ms: 140, measured_at: '2026-10-15T15:00:02.000Z' },
    { id: 'radar', state: 'down', severity: 'P0', http_status: 0, latency_ms: 15000, reason: 'timeout', measured_at: '2026-10-15T15:00:03.000Z' },
  ],
  vercel: { state: 'verified', items: [{ id: 'fox-nexus', name: 'fox-nexus', state: 'ready', deployment_created_at: '2026-10-15T09:00:00.000Z', commit_sha: null }] },
  github: { state: 'not_verified' },
});

describe('ORBIT adapter mapping', () => {
  it('rejects anything that is not a v1 snapshot', () => {
    expect(() => mapOrbitSnapshot({ schema: 'other', observed_at: '2026-10-15' }, URL_)).toThrow(OrbitSnapshotError);
    expect(() => mapOrbitSnapshot({ schema: 'fox.observability.snapshot.v1' }, URL_)).toThrow(OrbitSnapshotError);
    expect(() => mapOrbitSnapshot('nope', URL_)).toThrow(OrbitSnapshotError);
  });

  it('maps sites, P0 risks and deployments to OMNI system ids', () => {
    const { events, summary } = mapOrbitSnapshot(snapshot(), URL_);
    const health = events.filter((e) => e.event_type === 'health_observed');
    expect(health.map((e) => e.project_id)).toEqual(['fox-orbit', 'fox-land-passport', 'fox-planning-radar']);
    expect(events.filter((e) => e.event_type === 'risk_flagged')).toHaveLength(1);
    const dep = events.find((e) => e.event_type === 'deployment_observed')!;
    expect(dep.project_id).toBe('fox-nexus');
    expect(dep.event_id).toBe('orbit:deploy:fox-nexus:2026-10-15T09:00:00.000Z');
    expect(events.every((e) => e.event_id.startsWith('orbit:') && e.evidence_uri === URL_)).toBe(true);
    expect(summary.sitesUp).toBe(2);
    expect(describeSync(summary)).toContain('P0: radar');
  });

  it('marks unmeasured responses with lower confidence and never invents status', () => {
    const { events } = mapOrbitSnapshot(snapshot(), URL_);
    const radar = events.find((e) => e.event_type === 'health_observed' && e.project_id === 'fox-planning-radar')!;
    expect(radar.status).toBe('down');
    expect(radar.confidence).toBeLessThan(1);
  });

  it('skips deployments unless ORBIT verified the Vercel read', () => {
    const s = snapshot();
    s.vercel.state = 'not_verified';
    expect(mapOrbitSnapshot(s, URL_).events.some((e) => e.event_type === 'deployment_observed')).toBe(false);
  });

  it('event ids are stable for the same snapshot (idempotent recording)', () => {
    const a = mapOrbitSnapshot(snapshot(), URL_).events.map((e) => e.event_id);
    const b = mapOrbitSnapshot(snapshot(), URL_).events.map((e) => e.event_id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });

  it('latestHealthBySystem keeps the newest observation', () => {
    const rows = [
      { event_type: 'health_observed', project_id: 'x', observed_at: '2026-10-15T10:00:00Z', status: 'down' },
      { event_type: 'health_observed', project_id: 'x', observed_at: '2026-10-15T11:00:00Z', status: 'up' },
      { event_type: 'deployment_observed', project_id: 'x', observed_at: '2026-10-15T12:00:00Z', status: 'ready' },
    ];
    expect(latestHealthBySystem(rows).get('x')!.status).toBe('up');
  });
});

const task = (over: Partial<TaskRow> = {}): TaskRow => ({
  task_id: 't1',
  recommendation_id: 'rec-1',
  intent: 'inspect_repo_health',
  target_system: 'github',
  project_id: 'fox-orbit',
  scope: 'read:repo_metadata',
  risk_tier: 'R1',
  max_cost_gbp: '1',
  reason: 'Check',
  evidence_ids: ['ev-1'],
  idempotency_key: 'abc',
  dispatch_status: 'held_unconnected',
  ...over,
});

describe('NEXUS proposal contract', () => {
  it('only human-approved, R0–R2, capped, held proposals are dispatchable', () => {
    expect(() => checkDispatchable(task(), 'approved')).not.toThrow();
    expect(() => checkDispatchable(task(), 'reviewed')).toThrow(ProposalError);
    expect(() => checkDispatchable(task({ risk_tier: 'R3' }), 'approved')).toThrow(ProposalError);
    expect(() => checkDispatchable(task({ max_cost_gbp: 500 }), 'approved')).toThrow(ProposalError);
    expect(() => checkDispatchable(task({ dispatch_status: 'accepted_for_review' }), 'approved')).toThrow(ProposalError);
    expect(() => checkDispatchable(task({ recommendation_id: null }), 'approved')).toThrow(ProposalError);
  });

  it('envelope asks for review and never claims approval of execution', () => {
    const env = buildEnvelope(task(), new Date('2026-10-15T15:00:00Z'));
    expect(env.schema).toBe('fox.omni.task_proposal.v1');
    expect(env.approval_status).toBe('required');
    expect(env.max_cost_gbp).toBe(1);
  });

  it('signatures verify, and tampering or stale timestamps fail', () => {
    const secret = 'x'.repeat(64);
    const body = JSON.stringify(buildEnvelope(task()));
    const ts = String(Date.now());
    const sig = sign(body, ts, secret);
    expect(verify(body, ts, sig, secret)).toBe(true);
    expect(verify(body + ' ', ts, sig, secret)).toBe(false);
    expect(verify(body, ts, sig, 'y'.repeat(64))).toBe(false);
    expect(verify(body, String(Date.now() - 10 * 60_000), sign(body, String(Date.now() - 10 * 60_000), secret), secret)).toBe(false);
  });

  it('only an explicit accepted_for_review counts as success', () => {
    expect(interpretReply(202, { status: 'accepted_for_review' })).toBe('accepted_for_review');
    expect(interpretReply(409, { status: 'accepted_for_review' })).toBe('accepted_for_review');
    expect(interpretReply(200, { status: 'completed' })).toBe('failed');
    expect(interpretReply(200, null)).toBe('failed');
    expect(interpretReply(422, { status: 'rejected' })).toBe('rejected');
    expect(interpretReply(500, {})).toBe('failed');
  });
});
