/**
 * Which account the persisted query cache belongs to.
 *
 * The offline cache is one browser-wide IndexedDB entry, so without this every account on
 * a device reads and writes the same blob, and the only defence is a destructive purge.
 * That was tolerable while everything cached was your own; shared lists make it someone
 * else's data, so the store is now keyed by identity and each account gets its own entry.
 *
 * Mirrored in localStorage because the persister has to choose a key synchronously at boot,
 * before the session has resolved.
 */
const IDENTITY_STORAGE_KEY = "disscount-cache-identity";
const ANONYMOUS = "anon";

let currentIdentity: string | null = null;

function readStoredIdentity(): string {
  if (typeof window === "undefined") return ANONYMOUS;

  try {
    return window.localStorage.getItem(IDENTITY_STORAGE_KEY) ?? ANONYMOUS;
  } catch {
    // Private mode or blocked storage. Everyone shares the anonymous bucket, which is
    // the pre-existing behaviour rather than a regression.
    return ANONYMOUS;
  }
}

export function getCacheIdentity(): string {
  currentIdentity ??= readStoredIdentity();
  return currentIdentity;
}

export function setCacheIdentity(userId: string | null): void {
  currentIdentity = userId ?? ANONYMOUS;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, currentIdentity);
  } catch {
    // Nothing to do: the in-memory value still scopes this session's writes.
  }
}

/** Appends the current identity, so one account's cache is unreadable under another. */
export function scopedCacheKey(baseKey: string): string {
  return `${baseKey}:${getCacheIdentity()}`;
}
