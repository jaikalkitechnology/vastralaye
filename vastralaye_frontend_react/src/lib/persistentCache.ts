/**
 * Tiny localStorage cache for admin-managed content that must survive a page
 * refresh.
 *
 * Without it, anything fetched on mount paints its built-in default first and
 * swaps a moment later — so a refresh flashes the stock hero before the
 * admin's banner appears. Seeding state from here renders the last-known
 * *admin* version immediately, and the fetch that follows quietly corrects it.
 *
 * Stale-while-revalidate, deliberately with no TTL: the cached copy is only
 * ever on screen for the length of one request, and a wrong banner for 200ms
 * beats the wrong banner plus a visible jump.
 */

const PREFIX = 'vastralaye:';

/** Bump when a cached shape changes, so old entries are ignored not misread. */
const VERSION = 1;

interface Entry<T> {
  v: number;
  data: T;
}

export const readCache = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || entry.v !== VERSION) return null;
    return entry.data ?? null;
  } catch {
    // Private mode, quota, or hand-edited junk — treat as a cold cache.
    return null;
  }
};

export const writeCache = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: VERSION, data }));
  } catch {
    /* storage full or unavailable — the fetch still works, just no head start */
  }
};
