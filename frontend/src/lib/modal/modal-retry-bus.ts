// Sibling of modal-error-bus: a failed save parks the field values that must survive the
// remount but must never reach localStorage, such as a loyalty card number. In memory only,
// so it dies with the tab, and it is dropped the moment the retry reads it.
const STASH_TTL_MS = 60_000;

interface IStashedValues {
  values: Record<string, unknown>;
  expiresAt: number;
}

const stash = new Map<string, IStashedValues>();

export function stashModalValues(
  key: string,
  values: Record<string, unknown>,
): void {
  // Abandoned flows never call takeModalValues; evict expired entries so the map stays bounded.
  const now = Date.now();
  for (const [existingKey, entry] of stash) {
    if (entry.expiresAt <= now) stash.delete(existingKey);
  }
  stash.set(key, { values, expiresAt: now + STASH_TTL_MS });
}

export function takeModalValues(
  key: string,
): Record<string, unknown> | undefined {
  const entry = stash.get(key);
  stash.delete(key);
  if (!entry || entry.expiresAt <= Date.now()) return undefined;
  return entry.values;
}
