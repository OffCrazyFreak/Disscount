/** Bounded, oldest first, so crawlers trying endless made-up keys cannot grow it forever. */
export function createExpiringKeySet(ttlMs: number, limit: number) {
  const until = new Map<string, number>();

  function has(key: string): boolean {
    const expiresAt = until.get(key);

    if (expiresAt === undefined) return false;
    if (expiresAt > Date.now()) return true;

    until.delete(key);
    return false;
  }

  function add(key: string) {
    // Deleting first moves the key to the end, so the limit drops the oldest entry.
    until.delete(key);
    until.set(key, Date.now() + ttlMs);

    if (until.size > limit) {
      const oldest = until.keys().next().value;
      if (oldest !== undefined) until.delete(oldest);
    }
  }

  return { has, add };
}
