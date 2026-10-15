'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer, getOwner } from '@/lib/supabase/server';
import { NODE_BY_ID } from '@/lib/registry/nodes';
import { syncOrbit } from '@/lib/integrations/orbit';
import { sendProposal, nexusConfigured } from '@/lib/integrations/nexus';
import { checkDispatchable, ProposalError, type TaskRow } from '@/lib/integrations/nexusContract';
import { parseIngestPayload, canTransition, ValidationError, type RecStatus, type Recommendation, REC_STATUSES } from '@/lib/engine/core';

export type ActionResult = { ok: boolean; message: string };

async function requireOwner() {
  const owner = await getOwner();
  if (!owner || (owner.role !== 'owner' && owner.role !== 'admin')) throw new Error('Not authorised');
  return owner;
}
const str = (f: FormData, k: string, max = 4000) => String(f.get(k) ?? '').trim().slice(0, max);

/* ── Approval state machine (mirrored and enforced by a Postgres trigger) ── */
export async function transitionRecommendation(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  const id = str(form, 'id', 128);
  const to = str(form, 'to', 32) as RecStatus;
  const note = str(form, 'note', 1000) || null;
  if (!(REC_STATUSES as readonly string[]).includes(to)) return { ok: false, message: 'Unknown status' };
  const sb = await supabaseServer();
  const { data: rec } = await sb.from('recommendations').select('status,risk_tier').eq('id', id).maybeSingle();
  if (!rec) return { ok: false, message: 'Recommendation not found' };
  const check = canTransition(rec.status as RecStatus, to, { isHumanOwner: true }, rec.risk_tier);
  if (!check.ok) return { ok: false, message: check.reason! };
  const { error } = await sb.from('recommendations').update({ status: to, approval_note: note }).eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command', 'layout');
  return { ok: true, message: `Moved to ${to.replace('_', ' ')}` };
}

/* ── ORBIT read-only adapter: owner-triggered sync ── */
export async function syncOrbitNow(_: ActionResult | null): Promise<ActionResult> {
  await requireOwner();
  const r = await syncOrbit();
  revalidatePath('/command', 'layout');
  return { ok: r.ok, message: r.message };
}

/* ── Assign an idea to an OMNI sphere (it orbits that globe as a moon) ── */
export async function assignSphere(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  const id = str(form, 'id', 128);
  const sphere = str(form, 'sphere_id', 64) || null;
  if (sphere && !NODE_BY_ID[sphere]) return { ok: false, message: 'Unknown sphere' };
  const sb = await supabaseServer();
  const { error } = await sb.from('recommendations').update({ sphere_id: sphere }).eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command', 'layout');
  return { ok: true, message: sphere ? `Assigned to ${NODE_BY_ID[sphere].label}` : 'Unassigned' };
}

/* ── Evidence / recommendation ingestion (JSON contract from agent-pack/schemas) ── */
export async function ingestJson(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const raw = str(form, 'payload', 500_000);
  let parsed;
  try {
    parsed = parseIngestPayload(JSON.parse(raw));
  } catch (e) {
    return { ok: false, message: e instanceof ValidationError || e instanceof SyntaxError ? e.message : 'Invalid payload' };
  }
  const sb = await supabaseServer();
  if (parsed.kind === 'evidence') {
    const rows = parsed.records.map((r) => ({ ...r, ingested_by: owner.userId }));
    const { error } = await sb.from('evidence').upsert(rows, { onConflict: 'id' });
    if (error) return { ok: false, message: error.message };
  } else {
    const rows = (parsed.records as Recommendation[]).map((r) => ({ ...r, proposed_by: 'owner-ingest' }));
    const { error } = await sb.from('recommendations').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath('/command', 'layout');
  return { ok: true, message: `Ingested ${parsed.records.length} ${parsed.kind} record(s). Existing recommendation IDs are never overwritten.` };
}

export async function deleteEvidence(form: FormData) {
  await requireOwner();
  const sb = await supabaseServer();
  await sb.from('evidence').delete().eq('id', str(form, 'id', 128));
  revalidatePath('/command/evidence');
}

/* ── Decision ledger ── */
export async function createDecision(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const title = str(form, 'title', 200);
  const hypothesis = str(form, 'hypothesis');
  if (!title || !hypothesis) return { ok: false, message: 'Title and hypothesis are required' };
  const options = str(form, 'options')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const chosen = str(form, 'chosen_option', 500) || null;
  const sb = await supabaseServer();
  const { error } = await sb.from('decisions').insert({
    title,
    hypothesis,
    project_id: str(form, 'project_id', 64) || null,
    options,
    chosen_option: chosen,
    rationale: str(form, 'rationale') || null,
    expected_outcome: str(form, 'expected_outcome') || null,
    evidence_ids: str(form, 'evidence_ids').split(',').map((s) => s.trim()).filter(Boolean),
    review_on: str(form, 'review_on', 10) || null,
    approved_by_human: !!chosen,
    approved_by: chosen ? owner.userId : null,
    approved_at: chosen ? new Date().toISOString() : null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command/memory');
  return { ok: true, message: 'Decision recorded in institutional memory' };
}

export async function recordOutcome(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  const sb = await supabaseServer();
  const { error } = await sb
    .from('decisions')
    .update({ observed_outcome: str(form, 'observed_outcome') || null, lessons: str(form, 'lessons') || null, updated_at: new Date().toISOString() })
    .eq('id', str(form, 'id', 64));
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command/memory');
  return { ok: true, message: 'Outcome and lessons saved' };
}

/* ── Cognitive amplifier: working context ── */
export async function createNote(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  const title = str(form, 'title', 200);
  const body = str(form, 'body', 8000);
  if (!title || !body) return { ok: false, message: 'Title and note are required' };
  const sb = await supabaseServer();
  const { error } = await sb.from('context_notes').insert({
    title,
    body,
    project_id: str(form, 'project_id', 64) || null,
    tags: str(form, 'tags', 300).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    pinned: form.get('pinned') === 'on',
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command/memory');
  return { ok: true, message: 'Context saved' };
}
export async function togglePin(form: FormData) {
  await requireOwner();
  const sb = await supabaseServer();
  await sb.from('context_notes').update({ pinned: form.get('pinned') !== 'true' }).eq('id', str(form, 'id', 64));
  revalidatePath('/command/memory');
}
export async function deleteNote(form: FormData) {
  await requireOwner();
  const sb = await supabaseServer();
  await sb.from('context_notes').delete().eq('id', str(form, 'id', 64));
  revalidatePath('/command/memory');
}

/* ── NEXUS task proposal (held until a verified NEXUS adapter exists) ── */
export async function proposeNexusTask(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  const recId = str(form, 'recommendation_id', 128);
  const sb = await supabaseServer();
  const { data: rec } = await sb.from('recommendations').select('*').eq('id', recId).maybeSingle();
  if (!rec) return { ok: false, message: 'Recommendation not found' };
  if (rec.status !== 'approved') return { ok: false, message: 'Only human-approved recommendations can become NEXUS task proposals' };
  if (rec.risk_tier === 'R4') return { ok: false, message: 'R4 is unavailable' };
  const { error } = await sb.from('task_proposals').insert({
    recommendation_id: recId,
    intent: str(form, 'intent', 200) || `evaluate:${recId}`,
    target_system: str(form, 'target_system', 64) || 'nexus',
    project_id: str(form, 'project_id', 64) || 'fox-ecosystem',
    scope: str(form, 'scope', 200) || 'read:metadata',
    risk_tier: rec.risk_tier,
    max_cost_gbp: Math.max(0, Number(str(form, 'max_cost_gbp', 12)) || 0),
    reason: rec.title,
    evidence_ids: rec.evidence_ids,
    dispatch_status: 'held_unconnected',
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command/approvals');
  return {
    ok: true,
    message: nexusConfigured() ? 'Task proposal held — send it to NEXUS from the proposals table when ready' : 'Task proposal held — NEXUS proposal endpoint not configured, nothing was dispatched',
  };
}

/* ── Send a held proposal to NEXUS for review (owner click only; NEXUS decides independently) ── */
export async function dispatchNexusTask(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  if (!nexusConfigured()) return { ok: false, message: 'NEXUS proposal endpoint is not configured — the proposal stays held' };
  const sb = await supabaseServer();
  const { data: task } = await sb.from('task_proposals').select('*').eq('task_id', str(form, 'task_id', 64)).maybeSingle();
  if (!task) return { ok: false, message: 'Task proposal not found' };
  const { data: rec } = task.recommendation_id
    ? await sb.from('recommendations').select('status').eq('id', task.recommendation_id).maybeSingle()
    : { data: null };
  try {
    checkDispatchable(task as TaskRow, rec?.status ?? null);
  } catch (e) {
    return { ok: false, message: e instanceof ProposalError ? e.message : 'Not dispatchable' };
  }
  const r = await sendProposal(task as TaskRow);
  const { error } = await sb.from('task_proposals').update({ dispatch_status: r.status }).eq('task_id', task.task_id);
  revalidatePath('/command/approvals');
  if (error) return { ok: false, message: error.message };
  return { ok: r.status === 'accepted_for_review', message: `${r.status.replace(/_/g, ' ')} · ${r.detail}` };
}

/* ── Account ── */
export async function changePassword(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireOwner();
  const pw = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  if (pw.length < 14) return { ok: false, message: 'Use at least 14 characters' };
  if (pw !== confirm) return { ok: false, message: 'Passwords do not match' };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: pw, data: { must_change_password: false } });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/command', 'layout');
  return { ok: true, message: 'Password updated' };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/');
}
