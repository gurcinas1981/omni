import 'server-only';
import { supabaseServer } from '@/lib/supabase/server';
import { mapOrbitSnapshot, describeSync, OrbitSnapshotError } from './orbitMap';

/**
 * ORBIT read-only adapter. Runs only on the server, only for the signed-in owner.
 * GET ORBIT /api/observability with a dedicated bearer (ORBIT_READ_TOKEN = OMNI_READ_TOKEN on fox-orbit),
 * then record events + connection evidence through the owner-only RPC `record_orbit_sync`.
 * The token never reaches the browser; the response is not proxied to the client.
 */

const DEFAULT_URL = 'https://ecosystem.foxintelligence.co.uk/api/observability';
const TIMEOUT_MS = 15_000;
export const AUTO_SYNC_MINUTES = 15;

export type OrbitSyncResult = { ok: boolean; message: string; inserted?: number };

export function orbitConfigured() {
  const t = process.env.ORBIT_READ_TOKEN;
  return typeof t === 'string' && t.length >= 16;
}

function orbitUrl() {
  const raw = process.env.ORBIT_OBSERVABILITY_URL || DEFAULT_URL;
  const u = new URL(raw);
  if (u.protocol !== 'https:' || !u.hostname.endsWith('.foxintelligence.co.uk')) throw new Error('ORBIT_OBSERVABILITY_URL must be an https *.foxintelligence.co.uk URL');
  return u.toString();
}

async function record(events: unknown[], ok: boolean, evidence: string) {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc('record_orbit_sync', { events, ok, evidence });
  if (error) throw new Error(error.message);
  return data as { received: number; inserted: number; connection_status: string };
}

export async function syncOrbit(): Promise<OrbitSyncResult> {
  if (!orbitConfigured()) return { ok: false, message: 'ORBIT_READ_TOKEN is not configured on this deployment.' };
  let url: string;
  try {
    url = orbitUrl();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  let snapshot: unknown;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.ORBIT_READ_TOKEN}`, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'manual', // a gate redirect means the token was refused — never follow it to the sign-in page
      signal: controller.signal,
    });
    if (res.status !== 200) throw new Error(res.status >= 300 && res.status < 400 ? 'ORBIT refused the token (redirected to sign-in)' : `ORBIT HTTP ${res.status}`);
    if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error('ORBIT returned non-JSON');
    snapshot = await res.json();
  } catch (e) {
    const reason = (e as Error).name === 'AbortError' ? 'ORBIT timed out' : (e as Error).message;
    await record([], false, `Read failed ${new Date().toISOString()}: ${reason}`).catch(() => {});
    return { ok: false, message: reason };
  } finally {
    clearTimeout(timer);
  }

  try {
    const { events, summary } = mapOrbitSnapshot(snapshot, url);
    const r = await record(events, true, describeSync(summary));
    return { ok: true, inserted: r.inserted, message: `ORBIT read verified · ${summary.sitesUp}/${summary.sitesChecked} sites up · ${r.inserted} new event(s)` };
  } catch (e) {
    const reason = e instanceof OrbitSnapshotError ? `Snapshot rejected: ${e.message}` : (e as Error).message;
    await record([], false, `Read failed ${new Date().toISOString()}: ${reason}`).catch(() => {});
    return { ok: false, message: reason };
  }
}

/** Sync when the last attempt (systems.updated_at of fox-orbit) is older than AUTO_SYNC_MINUTES. Never throws into the page. */
export async function maybeSyncOrbit(lastAttempt: string | null | undefined): Promise<OrbitSyncResult | null> {
  if (!orbitConfigured()) return null;
  if (lastAttempt && Date.now() - new Date(lastAttempt).getTime() < AUTO_SYNC_MINUTES * 60_000) return null;
  try {
    return await syncOrbit();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
