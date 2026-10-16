/**
 * Pure mapping from ORBIT's `fox.observability.snapshot.v1` to OMNI `orbit_events` rows.
 * No I/O here so it can be tested against fixtures. Only values ORBIT actually measured are carried;
 * missing data becomes absent fields, never a guessed "healthy".
 */

export const ORBIT_SCHEMA = 'fox.observability.snapshot.v1';

/** ORBIT site id / Vercel project → OMNI `systems.id`. Unknown ids are kept under their ORBIT name. */
export const ORBIT_SITE_TO_SYSTEM: Record<string, string> = {
  orbit: 'fox-orbit',
  nexus: 'fox-nexus',
  landiq: 'fox-land-iq',
  landsearch: 'fox-land-search',
  radar: 'fox-planning-radar',
  'fox-intelligence': 'fox-intelligence',
  'fox-atlas': 'fox-atlas',
  passport: 'fox-land-passport',
  pilot: 'fox-land-passport',
  omni: 'fox-omnisynapse',
  gis: 'fox-gis',
};
export const VERCEL_PROJECT_TO_SYSTEM: Record<string, string> = {
  'fox-orbit': 'fox-orbit',
  'fox-nexus': 'fox-nexus',
  landiq: 'fox-land-iq',
  landsearch: 'fox-land-search',
  'fox-planning-radar': 'fox-planning-radar',
  'fox-intelligence': 'fox-intelligence',
  'fox-atlas': 'fox-atlas',
  'land-passport': 'fox-land-passport',
  'land-passport-derby': 'fox-land-passport',
  omni: 'fox-omnisynapse',
  'fox-gis': 'fox-gis',
};

export interface OrbitEventRow {
  event_id: string;
  event_type: 'health_observed' | 'deployment_observed' | 'risk_flagged';
  project_id: string;
  observed_at: string;
  status: string | null;
  confidence: number;
  metrics: Record<string, string | number | boolean | null>;
  evidence_uri: string;
}

export interface OrbitSummary {
  observedAt: string;
  sitesChecked: number;
  sitesUp: number;
  sitesDegraded: number;
  sitesDown: number;
  p0: string[];
  p50: number | null;
  p95: number | null;
  vercel: string;
  github: string;
}

export class OrbitSnapshotError extends Error {}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const s = (v: unknown, max = 120): string | null => (typeof v === 'string' && v.length ? v.slice(0, max) : null);
const n = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const iso = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 48);
/** Minute bucket keeps event ids stable if the same snapshot is recorded twice. */
const minute = (isoStr: string) => isoStr.slice(0, 16);

export function mapOrbitSnapshot(raw: unknown, sourceUrl: string): { events: OrbitEventRow[]; summary: OrbitSummary } {
  if (!isObj(raw)) throw new OrbitSnapshotError('Snapshot is not an object');
  if (raw.schema !== ORBIT_SCHEMA) throw new OrbitSnapshotError(`Unexpected schema: ${String(raw.schema ?? 'missing')}`);
  const observedAt = iso(raw.observed_at);
  if (!observedAt) throw new OrbitSnapshotError('Snapshot has no valid observed_at');

  const events: OrbitEventRow[] = [];
  const sites = Array.isArray(raw.sites) ? raw.sites.filter(isObj).slice(0, 50) : [];
  for (const site of sites) {
    const id = s(site.id, 48);
    if (!id) continue;
    const project = ORBIT_SITE_TO_SYSTEM[id] ?? `orbit-${slug(id)}`;
    const at = iso(site.measured_at) ?? observedAt;
    const httpStatus = n(site.http_status);
    const metrics = {
      orbit_site: id,
      url: s(site.url, 200),
      access: s(site.access, 16),
      http_status: httpStatus,
      latency_ms: n(site.latency_ms),
      severity: s(site.severity, 8),
      reason: s(site.reason, 160),
      metric: s(site.metric, 80),
    };
    events.push({
      event_id: `orbit:health:${slug(id)}:${minute(at)}`,
      event_type: 'health_observed',
      project_id: project,
      observed_at: at,
      status: s(site.state, 24),
      // A measured HTTP response is direct observation; a network error/timeout is observed absence.
      confidence: httpStatus && httpStatus > 0 ? 1 : 0.8,
      metrics,
      evidence_uri: sourceUrl,
    });
    if (s(site.severity, 8) === 'P0') {
      events.push({
        event_id: `orbit:risk:${slug(id)}:${minute(at)}`,
        event_type: 'risk_flagged',
        project_id: project,
        observed_at: at,
        status: 'P0',
        confidence: 1,
        metrics: { orbit_site: id, reason: s(site.reason, 160), state: s(site.state, 24) },
        evidence_uri: sourceUrl,
      });
    }
  }

  const vercel = isObj(raw.vercel) ? raw.vercel : {};
  const vercelState = s(vercel.state, 24) ?? 'unknown';
  if (vercelState === 'verified' && Array.isArray(vercel.items)) {
    for (const item of vercel.items.filter(isObj).slice(0, 50)) {
      const name = s(item.name, 64) ?? s(item.id, 64);
      if (!name) continue;
      const created = iso(item.deployment_created_at);
      const project = VERCEL_PROJECT_TO_SYSTEM[name] ?? `vercel-${slug(name)}`;
      events.push({
        // One event per production deployment: repeated syncs do not duplicate it.
        event_id: `orbit:deploy:${slug(name)}:${created ?? `none-${minute(observedAt)}`}`,
        event_type: 'deployment_observed',
        project_id: project,
        observed_at: created ?? observedAt,
        status: s(item.state, 32),
        confidence: 1,
        metrics: { vercel_project: name, commit_sha: s(item.commit_sha, 40), source: s(item.source, 120) },
        evidence_uri: sourceUrl,
      });
    }
  }

  const summaryRaw = isObj(raw.summary) ? raw.summary : {};
  const github = isObj(raw.github) ? s(raw.github.state, 24) ?? 'unknown' : 'unknown';
  const summary: OrbitSummary = {
    observedAt,
    sitesChecked: n(summaryRaw.sites_checked) ?? sites.length,
    sitesUp: n(summaryRaw.sites_up) ?? 0,
    sitesDegraded: n(summaryRaw.sites_degraded) ?? 0,
    sitesDown: n(summaryRaw.sites_down) ?? 0,
    p0: Array.isArray(summaryRaw.p0_alerts) ? summaryRaw.p0_alerts.filter((x): x is string => typeof x === 'string').slice(0, 20) : [],
    p50: n(summaryRaw.http_p50_ms),
    p95: n(summaryRaw.http_p95_ms),
    vercel: vercelState,
    github,
  };
  return { events: events.slice(0, 200), summary };
}

export function describeSync(summary: OrbitSummary): string {
  const lat = summary.p50 !== null ? ` · p50 ${summary.p50} ms` : '';
  const p0 = summary.p0.length ? ` · P0: ${summary.p0.join(', ')}` : '';
  return `ORBIT ${ORBIT_SCHEMA} read ${summary.observedAt} · ${summary.sitesUp}/${summary.sitesChecked} sites up${lat}${p0} · Vercel ${summary.vercel} · GitHub ${summary.github}`;
}

/** Latest health event per system, newest first. */
export function latestHealthBySystem<T extends { event_type: string; project_id: string | null; observed_at: string }>(events: T[]): Map<string, T> {
  const out = new Map<string, T>();
  for (const e of events) {
    if (e.event_type !== 'health_observed' || !e.project_id) continue;
    const cur = out.get(e.project_id);
    if (!cur || cur.observed_at < e.observed_at) out.set(e.project_id, e);
  }
  return out;
}
