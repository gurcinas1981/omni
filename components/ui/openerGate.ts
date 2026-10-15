/** Opener cadence — shared by the lazy opener and the page that decides whether to load it. */
export const SEEN_KEY = 'omniOpenerSeen';
const REPLAY_AFTER_MS = 5 * 60 * 1000;

export function shouldPlayOpener() {
  try {
    if (new URLSearchParams(window.location.search).has('openerAt')) return true;
    if (window.location.hash.length > 1) return false;
    const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
    return Date.now() - seen > REPLAY_AFTER_MS;
  } catch {
    return true;
  }
}
