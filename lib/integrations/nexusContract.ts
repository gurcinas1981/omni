import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * OMNISYNAPSE → NEXUS bounded task proposal, `fox.omni.task_proposal.v1`.
 * Signed like the FOX telemetry fabric: bearer + HMAC-SHA256 over `${timestamp}.${rawBody}`.
 * A proposal is a request for NEXUS to *review*; NEXUS authenticates, authorises, logs and decides
 * independently. The only acceptable success reply is `accepted_for_review`.
 */

export const PROPOSAL_SCHEMA = 'fox.omni.task_proposal.v1';
export const DISPATCHABLE_RISK = ['R0', 'R1', 'R2'] as const;
export const MAX_SKEW_MS = 5 * 60_000;

export interface TaskRow {
  task_id: string;
  recommendation_id: string | null;
  intent: string;
  target_system: string;
  project_id: string;
  scope: string;
  risk_tier: string;
  max_cost_gbp: number | string;
  reason: string;
  evidence_ids: string[];
  idempotency_key: string;
  dispatch_status: string;
}

export interface ProposalEnvelope {
  schema: typeof PROPOSAL_SCHEMA;
  task_id: string;
  requested_by: 'omnisynapse';
  requested_for: 'owner';
  approved_by_owner: true;
  recommendation_id: string | null;
  intent: string;
  target_system: string;
  project_id: string;
  scope: string;
  risk_tier: string;
  approval_status: 'required';
  max_cost_gbp: number;
  idempotency_key: string;
  reason: string;
  evidence_ids: string[];
  issued_at: string;
}

export class ProposalError extends Error {}

/** Gate before anything leaves OMNI. Pure so the rules are tested. */
export function checkDispatchable(task: TaskRow, recStatus: string | null): void {
  if (task.dispatch_status !== 'held_unconnected' && task.dispatch_status !== 'failed') throw new ProposalError(`Already ${task.dispatch_status.replace(/_/g, ' ')}`);
  if (!task.recommendation_id || recStatus !== 'approved') throw new ProposalError('The linked recommendation must be human-approved');
  if (!(DISPATCHABLE_RISK as readonly string[]).includes(task.risk_tier)) throw new ProposalError(`${task.risk_tier} proposals are not dispatched automatically — hand this one to NEXUS yourself`);
  const cap = Number(task.max_cost_gbp);
  if (!Number.isFinite(cap) || cap < 0 || cap > 50) throw new ProposalError('Cost cap must be between £0 and £50');
}

export function buildEnvelope(task: TaskRow, now = new Date()): ProposalEnvelope {
  return {
    schema: PROPOSAL_SCHEMA,
    task_id: task.task_id,
    requested_by: 'omnisynapse',
    requested_for: 'owner',
    approved_by_owner: true,
    recommendation_id: task.recommendation_id,
    intent: task.intent.slice(0, 200),
    target_system: task.target_system.slice(0, 64),
    project_id: task.project_id.slice(0, 64),
    scope: task.scope.slice(0, 200),
    risk_tier: task.risk_tier,
    approval_status: 'required',
    max_cost_gbp: Math.round(Number(task.max_cost_gbp) * 100) / 100,
    idempotency_key: task.idempotency_key,
    reason: task.reason.slice(0, 1000),
    evidence_ids: task.evidence_ids.slice(0, 50),
    issued_at: now.toISOString(),
  };
}

export function sign(rawBody: string, timestamp: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

/** Reference verifier for the NEXUS receiver (docs/NEXUS_PROPOSAL_RECEIVER.md uses the same rule). */
export function verify(rawBody: string, timestamp: string, signature: string, secret: string, now = Date.now()): boolean {
  const t = Number(timestamp);
  if (!Number.isFinite(t) || Math.abs(now - t) > MAX_SKEW_MS) return false;
  const a = Buffer.from(sign(rawBody, timestamp, secret));
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Map NEXUS's reply to our dispatch_status. Anything unexpected is a failure, never "finished". */
export function interpretReply(httpStatus: number, body: unknown): 'accepted_for_review' | 'rejected' | 'failed' {
  const status = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).status : undefined;
  if ((httpStatus === 200 || httpStatus === 202) && status === 'accepted_for_review') return 'accepted_for_review';
  if (httpStatus === 409 && status === 'accepted_for_review') return 'accepted_for_review'; // idempotent replay
  if (httpStatus === 422 || status === 'rejected') return 'rejected';
  return 'failed';
}
