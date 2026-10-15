import 'server-only';
import { buildEnvelope, sign, interpretReply } from './nexusContract';
import type { TaskRow } from './nexusContract';

/**
 * NEXUS proposal dispatcher. Disabled until NEXUS publishes a receiver and both env vars are set:
 *   NEXUS_PROPOSALS_URL     https://nexus.foxintelligence.co.uk/api/omni-proposals (or another *.foxintelligence.co.uk URL)
 *   NEXUS_PROPOSALS_SECRET  ≥32 chars, shared with the NEXUS receiver (bearer + HMAC key)
 */

export function nexusConfigured() {
  const url = process.env.NEXUS_PROPOSALS_URL;
  const secret = process.env.NEXUS_PROPOSALS_SECRET;
  if (!url || !secret || secret.length < 32) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.foxintelligence.co.uk');
  } catch {
    return false;
  }
}

export async function sendProposal(task: TaskRow): Promise<{ status: 'accepted_for_review' | 'rejected' | 'failed'; detail: string }> {
  if (!nexusConfigured()) return { status: 'failed', detail: 'NEXUS proposal endpoint is not configured' };
  const body = JSON.stringify(buildEnvelope(task));
  const ts = String(Date.now());
  const secret = process.env.NEXUS_PROPOSALS_SECRET!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(process.env.NEXUS_PROPOSALS_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
        'X-Fox-Timestamp': ts,
        'X-Fox-Signature': sign(body, ts, secret),
        'Idempotency-Key': task.idempotency_key,
      },
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON reply → failed below */
    }
    const status = interpretReply(res.status, json);
    return { status, detail: `NEXUS HTTP ${res.status}` };
  } catch (e) {
    return { status: 'failed', detail: (e as Error).name === 'AbortError' ? 'NEXUS timed out' : 'NEXUS unreachable' };
  } finally {
    clearTimeout(timer);
  }
}
