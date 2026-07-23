// A closed modal unmounts, so a failed save parks its error here for the remount.
const STASH_TTL_MS = 60_000;

interface IStashedError {
  error: unknown;
  expiresAt: number;
}

const stash = new Map<string, IStashedError>();

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
