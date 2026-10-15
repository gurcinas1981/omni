import 'server-only';
import { supabaseServer } from '@/lib/supabase/server';
import type { Evidence, Recommendation, SystemRow } from '@/lib/engine/core';

export interface RecRow extends Recommendation {
  risk_tier: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
  human_approved_at: string | null;
  approval_note: string | null;
  created_at: string;
  updated_at: string;
}
export interface SystemFull extends SystemRow {
  reference_url: string | null;
  category: string | null;
  description: string | null;
  last_verified: string | null;
  verification_evidence: string | null;
  updated_at: string | null;
}
export interface DecisionRow {
  id: string;
  project_id: string | null;
  title: string;
  hypothesis: string;
  options: string[];
  chosen_option: string | null;
  rationale: string | null;
  approved_by_human: boolean;
  approved_at: string | null;
  expected_outcome: string | null;
  observed_outcome: string | null;
  lessons: string | null;
  evidence_ids: string[];
  review_on: string | null;
  created_at: string;
}
export interface NoteRow {
  id: string;
  project_id: string | null;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
}
export interface AuditRow {
  id: number;
  at: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  extra: Record<string, unknown>;
}
export interface OrbitEvent {
  event_id: string;
  event_type: string;
  source_system: string;
  project_id: string | null;
  observed_at: string;
  status: string | null;
  confidence: number | null;
  metrics: Record<string, unknown>;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function loadCore() {
  const sb = await supabaseServer();
  const [ev, rec, sys] = await Promise.all([
    sb.from('evidence').select('*').order('observed_at', { ascending: false }).limit(500),
    sb.from('recommendations').select('*').order('created_at', { ascending: false }).limit(500),
    sb.from('systems').select('*').order('name'),
  ]);
  const evidence: Evidence[] = (ev.data ?? []).map((e) => ({ ...e, confidence: Number(e.confidence) }));
  const recs: RecRow[] = (rec.data ?? []).map((r) => ({ ...r, cost_gbp: num(r.cost_gbp) }));
  const systems: SystemFull[] = sys.data ?? [];
  return { evidence, recs, systems, error: ev.error?.message || rec.error?.message || sys.error?.message || null };
}

export async function loadDecisions() {
  const sb = await supabaseServer();
  const [d, n] = await Promise.all([
    sb.from('decisions').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('context_notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(200),
  ]);
  return { decisions: (d.data ?? []) as DecisionRow[], notes: (n.data ?? []) as NoteRow[] };
}

export async function loadAudit(limit = 200) {
  const sb = await supabaseServer();
  const { data } = await sb.from('audit_events').select('*').order('at', { ascending: false }).limit(limit);
  return (data ?? []) as AuditRow[];
}

export async function loadOrbit(limit = 100) {
  const sb = await supabaseServer();
  const { data } = await sb.from('orbit_events').select('*').order('observed_at', { ascending: false }).limit(limit);
  return (data ?? []) as OrbitEvent[];
}

export async function loadTasks() {
  const sb = await supabaseServer();
  const { data } = await sb.from('task_proposals').select('*').order('created_at', { ascending: false }).limit(100);
  return data ?? [];
}

export const fmtDate = (s: string | null | undefined) =>
  s ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }).format(new Date(s)) : '—';
