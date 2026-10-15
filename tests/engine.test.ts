import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  validateEvidence,
  parseIngestPayload,
  eligibleRecommendations,
  scoreRecommendation,
  buildBrief,
  canTransition,
  ValidationError,
  type Evidence,
  type Recommendation,
} from '@/lib/engine/core';

const inbox = (name: string) =>
  JSON.parse(readFileSync(path.join(__dirname, '..', 'agent-pack', 'examples', 'inbox', name), 'utf8'));
const evidence = () => parseIngestPayload(inbox('sample_evidence.json')).records as Evidence[];
const recs = () => parseIngestPayload(inbox('sample_recommendations.json')).records as Recommendation[];

describe('ported python-runtime tests (5/5)', () => {
  it('rejects invalid source URL (file://)', () => {
    expect(() =>
      validateEvidence({ id: 'test', title: 'X', summary: 'Y', source_url: 'file:///etc/passwd', observed_at: '2026-10-15', classification: 'verified_primary', project_id: 'FOX', confidence: 0.7 }),
    ).toThrow(ValidationError);
  });
  it('produces no proposals without evidence', () => {
    expect(eligibleRecommendations(recs(), [], true)).toEqual([]);
  });
  it('demo records never leak into a normal brief', () => {
    expect(eligibleRecommendations(recs(), evidence(), false)).toHaveLength(0);
    expect(eligibleRecommendations(recs(), evidence(), true).length).toBeGreaterThan(0);
    expect(buildBrief({ recs: recs(), evidence: evidence() }).markdown).toContain('None validated');
    const demo = buildBrief({ recs: recs(), evidence: evidence(), includeDemo: true }).markdown;
    expect(demo).toContain('DEMONSTRATION');
    expect(demo).toContain('DEMO — Shared Site Record');
  });
  it('rejects duplicate ids within one payload', () => {
    const p = inbox('sample_evidence.json');
    p.records.push(p.records[0]);
    expect(() => parseIngestPayload(p)).toThrow(/Duplicate id/);
  });
  it('score is numeric', () => {
    expect(typeof scoreRecommendation(recs()[0])).toBe('number');
  });
});

describe('governance and safety', () => {
  it('rejects URLs with embedded credentials and javascript: scheme', () => {
    const base = { id: 'a', title: 't', summary: 's', observed_at: '2026-10-15', classification: 'verified_primary', project_id: 'p', confidence: 0.5 };
    expect(() => validateEvidence({ ...base, source_url: 'https://user:pw@example.com' })).toThrow();
    expect(() => validateEvidence({ ...base, source_url: 'javascript:alert(1)' })).toThrow();
  });
  it('ingested recommendations cannot arrive approved', () => {
    const p = inbox('sample_recommendations.json');
    p.records[0].status = 'approved';
    expect(() => parseIngestPayload(p)).toThrow(/proposed or reviewed/);
  });
  it('untrusted evidence classes cannot promote a recommendation', () => {
    const ev = evidence().map((e) => ({ ...e, classification: 'speculative' as const }));
    expect(eligibleRecommendations(recs(), ev, true)).toHaveLength(0);
  });
  it('only a human owner can approve; skip-review is illegal; R4 is blocked', () => {
    expect(canTransition('reviewed', 'approved', { isHumanOwner: false }).ok).toBe(false);
    expect(canTransition('proposed', 'approved', { isHumanOwner: true }).ok).toBe(false);
    expect(canTransition('reviewed', 'approved', { isHumanOwner: true }).ok).toBe(true);
    expect(canTransition('reviewed', 'approved', { isHumanOwner: true }, 'R4').ok).toBe(false);
  });
  it('brief never ranks more than three and lists unconnected systems', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ ...recs()[0], id: `r${i}` }));
    const b = buildBrief({ recs: many, evidence: evidence(), includeDemo: true, systems: [{ id: 'x', name: 'ORBIT', connection_status: 'UNCONNECTED' }] });
    expect(b.top).toHaveLength(3);
    expect(b.unconnected).toEqual(['ORBIT']);
  });
  it('higher risk lowers the score', () => {
    const r = recs()[0];
    expect(scoreRecommendation({ scores: { ...r.scores, security_risk: 5 } })).toBeLessThan(scoreRecommendation({ scores: { ...r.scores, security_risk: 0 } }));
  });
});
