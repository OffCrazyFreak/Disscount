/** Keyed by identity because shared lists put someone else's data here; mirrored in localStorage because the persister picks a key before the session resolves. */
const IDENTITY_STORAGE_KEY = "disscount-cache-identity";
export const ANONYMOUS_IDENTITY = "anon";

let currentIdentity: string | null = null;
const listeners = new Set<() => void>();

function readStoredIdentity(): string {
  if (typeof window === "undefined") return ANONYMOUS_IDENTITY;

  try {
    return (
      window.localStorage.getItem(IDENTITY_STORAGE_KEY) ?? ANONYMOUS_IDENTITY
    );
  } catch {
    // Private mode or blocked storage: everyone shares the anonymous bucket.
    return ANONYMOUS_IDENTITY;
  }
}

export function getCacheIdentity(): string {
  currentIdentity ??= readStoredIdentity();
  return currentIdentity;
}

export function persistedCacheIdentity(): string | null {
  return getCacheIdentity() === ANONYMOUS_IDENTITY ? null : getCacheIdentity();
}

/** The stored form of an account id, so callers can name an identity that is not current. */
export function toCacheIdentity(userId: string | null): string {
  return userId ?? ANONYMOUS_IDENTITY;
}

/** For useSyncExternalStore, so screens reading the identity follow a sign-out. */
export function subscribeToCacheIdentity(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCacheIdentity(userId: string | null): void {
  currentIdentity = userId ?? ANONYMOUS_IDENTITY;
  for (const listener of listeners) listener();

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, currentIdentity);
  } catch {
    // Nothing to do: the in-memory value still scopes this session's writes.
  }
}

/** `identity` is explicit for the purge, which must clear the account that is leaving rather than whichever is current after it awaits. */
export function scopedCacheKey(baseKey: string, identity?: string): string {
  return `${baseKey}:${identity ?? getCacheIdentity()}`;
}
