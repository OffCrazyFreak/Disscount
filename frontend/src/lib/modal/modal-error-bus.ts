// Read-once stash for the optimistic-close save pattern: entity modals unmount
// when they close, so a failed mutation stashes its error here, reopens the
// modal via URL, and the remounted form picks the error up exactly once.
const STASH_TTL_MS = 60_000;

interface StashedError {
  error: unknown;
  expiresAt: number;
}

const stash = new Map<string, StashedError>();

export function stashModalError(key: string, error: unknown): void {
  // Abandoned flows never call takeModalError; evict expired entries so the map stays bounded.
  const now = Date.now();
  for (const [existingKey, entry] of stash) {
    if (entry.expiresAt <= now) stash.delete(existingKey);
  }
  stash.set(key, { error, expiresAt: now + STASH_TTL_MS });
}

export function takeModalError(key: string): unknown {
  const entry = stash.get(key);
  stash.delete(key);
  if (!entry || entry.expiresAt <= Date.now()) return undefined;
  return entry.error;
}
