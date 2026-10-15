/**
 * OMNISYNAPSE Ω — deterministic evidence validation, scoring and brief engine.
 * TypeScript port of agent-pack/python-runtime/omnisynapse/core.py.
 * Pure functions: no network, no side effects, no automatic approvals.
 */

export const CLASSIFICATIONS = [
  'verified_primary',
  'credible_secondary',
  'internal_verified',
  'unverified',
  'hypothesis',
  'speculative',
] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];
export const TRUSTED: ReadonlySet<Classification> = new Set(['verified_primary', 'credible_secondary', 'internal_verified']);

export const SCORE_FIELDS = [
  'strategic_alignment',
  'commercial_value',
  'cross_platform_reuse',
  'technical_feasibility',
  'cognitive_amplification',
  'evidence_strength',
  'implementation_effort',
  'security_risk',
  'uncertainty',
] as const;
export type ScoreField = (typeof SCORE_FIELDS)[number];
export type Scores = Partial<Record<ScoreField, number>>;

export const DEFAULT_WEIGHTS: Record<ScoreField, number> = {
  strategic_alignment: 5,
  commercial_value: 4,
  cross_platform_reuse: 4,
  technical_feasibility: 3,
  cognitive_amplification: 3,
  evidence_strength: 5,
  implementation_effort: -2,
  security_risk: -4,
  uncertainty: -3,
};

export const REC_STATUSES = [
  'proposed',
  'reviewed',
  'approved',
  'rejected',
  'queued',
  'running',
  'verified_complete',
  'failed',
  'rolled_back',
] as const;
export type RecStatus = (typeof REC_STATUSES)[number];
export const RISK_TIERS = ['R0', 'R1', 'R2', 'R3', 'R4'] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export interface Evidence {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  published_at: string | null;
  observed_at: string;
  classification: Classification;
  project_id: string;
  confidence: number;
  demo: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  summary: string;
  impacted_systems: string[];
  cognitive_benefit: string;
  evidence_ids: string[];
  cost_gbp: number | null;
  estimated_effort: string;
  scores: Scores;
  status: RecStatus;
  demo: boolean;
  risk_tier?: RiskTier;
  council_cell?: string | null;
  /** OMNI sphere (category node id) this idea belongs to — renders as a moon around that globe. */
  sphere_id?: string | null;
}

export interface SystemRow {
  id: string;
  name: string;
  connection_status: string;
}

export class ValidationError extends Error {}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function isValidHttpUrl(s: unknown): boolean {
  if (typeof s !== 'string') return false;
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname && !u.username && !u.password;
  } catch {
    return false;
  }
}

function checkId(obj: Record<string, unknown>) {
  if (!nonEmpty(obj.id)) throw new ValidationError('Every record requires a non-empty string id');
  if ((obj.id as string).length > 128) throw new ValidationError('Record id too long');
}

export function validateEvidence(obj: unknown): Evidence {
  if (!obj || typeof obj !== 'object') throw new ValidationError('Evidence must be an object');
  const o = obj as Record<string, unknown>;
  checkId(o);
  for (const k of ['title', 'summary', 'source_url', 'observed_at', 'classification', 'project_id']) {
    if (!nonEmpty(o[k])) throw new ValidationError(`Evidence requires string field: ${k}`);
  }
  if (!isValidHttpUrl(o.source_url)) throw new ValidationError('Evidence requires valid http(s) source_url without embedded credentials');
  if (!(CLASSIFICATIONS as readonly string[]).includes(o.classification as string)) throw new ValidationError('Unknown evidence classification');
  const c = o.confidence ?? 0;
  if (typeof c !== 'number' || !Number.isFinite(c) || c < 0 || c > 1) throw new ValidationError('Evidence confidence must be 0..1');
  if (Number.isNaN(Date.parse(o.observed_at as string))) throw new ValidationError('observed_at must be an ISO date');
  return {
    id: o.id as string,
    title: o.title as string,
    summary: o.summary as string,
    source_url: o.source_url as string,
    published_at: nonEmpty(o.published_at) ? (o.published_at as string) : null,
    observed_at: o.observed_at as string,
    classification: o.classification as Classification,
    project_id: o.project_id as string,
    confidence: c,
    demo: o.demo === true,
  };
}

export function validateRecommendation(obj: unknown): Recommendation {
  if (!obj || typeof obj !== 'object') throw new ValidationError('Recommendation must be an object');
  const o = obj as Record<string, unknown>;
  checkId(o);
  for (const k of ['title', 'summary', 'cognitive_benefit', 'estimated_effort']) {
    if (!nonEmpty(o[k])) throw new ValidationError(`Recommendation requires field: ${k}`);
  }
  if (!Array.isArray(o.evidence_ids) || !o.evidence_ids.every((x) => typeof x === 'string'))
    throw new ValidationError('Recommendation evidence_ids must be an array of strings');
  if (!Array.isArray(o.impacted_systems) || !o.impacted_systems.every((x) => typeof x === 'string'))
    throw new ValidationError('Recommendation impacted_systems must be array of strings');
  const scores = o.scores as Record<string, unknown>;
  if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0)
    throw new ValidationError('Recommendation scores must use allowed named score fields');
  for (const [k, v] of Object.entries(scores)) {
    if (!(SCORE_FIELDS as readonly string[]).includes(k)) throw new ValidationError(`Unknown score field ${k}`);
    if (typeof v !== 'number' || v < 0 || v > 5) throw new ValidationError(`Invalid ${k} score (expected 0..5)`);
  }
  const cost = o.cost_gbp ?? null;
  if (cost !== null && (typeof cost !== 'number' || cost < 0)) throw new ValidationError('cost_gbp must be null or >= 0');
  const status = (o.status ?? 'proposed') as string;
  // Ingested records can never arrive pre-approved.
  if (status !== 'proposed' && status !== 'reviewed') throw new ValidationError('Ingested recommendations must be proposed or reviewed');
  const risk = (o.risk_tier ?? 'R0') as string;
  if (!(RISK_TIERS as readonly string[]).includes(risk)) throw new ValidationError('Invalid risk tier');
  const sphere = o.sphere_id ?? null;
  if (sphere !== null && (typeof sphere !== 'string' || !/^[a-z0-9-]{1,64}$/.test(sphere))) throw new ValidationError('Invalid sphere_id');
  return {
    id: o.id as string,
    title: o.title as string,
    summary: o.summary as string,
    impacted_systems: o.impacted_systems as string[],
    cognitive_benefit: o.cognitive_benefit as string,
    evidence_ids: o.evidence_ids as string[],
    cost_gbp: cost as number | null,
    estimated_effort: o.estimated_effort as string,
    scores: scores as Scores,
    status: status as RecStatus,
    demo: o.demo === true,
    risk_tier: risk as RiskTier,
    council_cell: nonEmpty(o.council_cell) ? (o.council_cell as string) : null,
    sphere_id: sphere as string | null,
  };
}

export type IngestKind = 'evidence' | 'recommendation';
export function parseIngestPayload(raw: unknown): { kind: IngestKind; records: (Evidence | Recommendation)[] } {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Payload must be an object');
  const p = raw as { kind?: unknown; records?: unknown };
  if ((p.kind !== 'evidence' && p.kind !== 'recommendation') || !Array.isArray(p.records))
    throw new ValidationError("Input must be {'kind': 'evidence|recommendation', 'records': [..]}");
  if (p.records.length > 200) throw new ValidationError('Maximum 200 records per ingest');
  const records = p.kind === 'evidence' ? p.records.map(validateEvidence) : p.records.map(validateRecommendation);
  const ids = new Set<string>();
  for (const r of records) {
    if (ids.has(r.id)) throw new ValidationError(`Duplicate id in payload: ${r.id}`);
    ids.add(r.id);
  }
  return { kind: p.kind, records };
}

export function scoreRecommendation(rec: Pick<Recommendation, 'scores'>, weights: Partial<Record<ScoreField, number>> = DEFAULT_WEIGHTS): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  return SCORE_FIELDS.reduce((sum, k) => sum + (w[k] ?? 0) * (rec.scores?.[k] ?? 0), 0);
}

export function eligibleRecommendations(recs: Recommendation[], evidence: Evidence[], includeDemo = false) {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const out: { rec: Recommendation; sources: Evidence[] }[] = [];
  for (const rec of recs) {
    if (rec.demo && !includeDemo) continue;
    if (['rejected', 'failed', 'rolled_back', 'verified_complete'].includes(rec.status)) continue;
    const sources = rec.evidence_ids
      .map((id) => byId.get(id))
      .filter((e): e is Evidence => !!e && (!e.demo || includeDemo) && TRUSTED.has(e.classification));
    // A proposal with no ingested, reasonably trusted source cannot be promoted.
    if (sources.length === 0) continue;
    out.push({ rec, sources });
  }
  return out;
}

export interface Brief {
  date: string;
  mode: 'demo' | 'evidence';
  unconnected: string[];
  top: { rank: number; rec: Recommendation; score: number; sources: Evidence[] }[];
  markdown: string;
}

export function ukDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(d);
}

export function buildBrief(opts: {
  recs: Recommendation[];
  evidence: Evidence[];
  systems?: SystemRow[];
  includeDemo?: boolean;
  weights?: Partial<Record<ScoreField, number>>;
  now?: Date;
}): Brief {
  const { recs, evidence, systems = [], includeDemo = false, weights = DEFAULT_WEIGHTS, now = new Date() } = opts;
  const date = ukDate(now);
  const ranked = eligibleRecommendations(recs, evidence, includeDemo)
    .map(({ rec, sources }) => ({ rec, sources, score: scoreRecommendation(rec, weights) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const unconnected = systems.filter((s) => !['READ_ONLY_VERIFIED', 'WRITE_SCOPED'].includes(s.connection_status)).map((s) => s.name);
  const descriptor = includeDemo ? 'DEMONSTRATION — DO NOT TREAT AS LIVE INTELLIGENCE' : 'EVIDENCE-BASED — ONLY INGESTED, SOURCED RECORDS';
  const lines = [
    '# OMNISYNAPSE Ω — FOX DAILY EXECUTIVE INTELLIGENCE',
    `**Date (UK):** ${date}  `,
    `**Mode:** ${descriptor}  `,
    '**Source scope:** Evidence held in OMNISYNAPSE memory only; no autonomous web research or FOX system access occurred.',
    '',
  ];
  if (unconnected.length) lines.push(`**Unconnected/unverified FOX systems:** ${unconnected.join(', ')}.`, '');
  if (ranked.length === 0) {
    lines.push(
      '**Strategic signal:** No current actionable proposal supported by ingested verified evidence. Connect authorised sources or import cited recommendations before drawing operational conclusions.',
      '',
      '**Top upgrades:** None validated.',
      '',
      '**New horizon:** Not assessed without current research.',
      '**Risk:** Missing integrations and unverified sources can create false confidence.',
      '**Founder decision:** Approve scoped read-only connections and a pilot evidence ingestion plan before any automation.',
      '**What changed:** No verified update supplied.',
    );
  } else {
    lines.push('**Strategic signal:** Ranked candidate improvements from ingested records; verify evidence currency and scope before acting.', '', '## Top FOX upgrades');
    for (const { rank, rec, score, sources } of ranked) {
      const links = sources
        .slice(0, 3)
        .map((s) => `[${s.title}](${s.source_url}) (${s.published_at ?? 'date unknown'})`)
        .join('; ');
      const money = rec.cost_gbp != null ? `£${Math.round(rec.cost_gbp).toLocaleString('en-GB')} indicative` : 'cost unverified';
      lines.push(
        `${rank}. **${rec.title}** — ${rec.summary} FOX impact: ${rec.impacted_systems.join(', ')}. Cognitive benefit: ${rec.cognitive_benefit}. Effort: ${rec.estimated_effort}; ${money}; relative score ${score.toFixed(0)}. Sources: ${links}.`,
      );
    }
    lines.push(
      '',
      '**New horizon:** Further research required; no new niche may be inferred solely from these records.',
      '**Key risk:** Conflicting sources, permissions or stale integration status must be verified before deployment.',
      '**Founder decision:** Choose one top-ranked proposal for bounded validation and authorise only scoped read-only discovery first.',
    );
  }
  return { date, mode: includeDemo ? 'demo' : 'evidence', unconnected, top: ranked, markdown: lines.join('\n') + '\n' };
}

/** Mirrors the database trigger so the UI only offers legal transitions. */
export const TRANSITIONS: Record<RecStatus, RecStatus[]> = {
  proposed: ['reviewed', 'rejected'],
  reviewed: ['approved', 'rejected', 'proposed'],
  approved: ['queued', 'rejected'],
  queued: ['running', 'failed', 'rejected'],
  running: ['verified_complete', 'failed', 'rolled_back'],
  failed: ['proposed', 'rolled_back'],
  rejected: [],
  verified_complete: [],
  rolled_back: [],
};

export function canTransition(from: RecStatus, to: RecStatus, actor: { isHumanOwner: boolean }, risk: RiskTier = 'R0'): { ok: boolean; reason?: string } {
  if (!TRANSITIONS[from]?.includes(to)) return { ok: false, reason: `Illegal transition ${from} -> ${to}` };
  if (to === 'approved' && !actor.isHumanOwner) return { ok: false, reason: 'Only an authenticated human owner can approve' };
  if (to === 'approved' && risk === 'R4') return { ok: false, reason: 'R4 actions are not available in this service' };
  return { ok: true };
}

/** Idea moon state: pending ideas orbit hollow; once the owner confirms (approved onwards) they become solid. */
export type MoonState = 'pending' | 'confirmed' | 'retired';
export function moonState(status: RecStatus): MoonState {
  if (status === 'proposed' || status === 'reviewed') return 'pending';
  if (status === 'rejected' || status === 'failed' || status === 'rolled_back') return 'retired';
  return 'confirmed';
}
