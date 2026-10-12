const pending = new Set<Promise<unknown>>();

/** Registered synchronously when a purge starts, so no write can slip in before it. */
export function trackPurge(purge: Promise<unknown>) {
  const tracked = purge.then(
    () => undefined,
    () => undefined,
  );
  pending.add(tracked);
  void tracked.then(() => pending.delete(tracked));
}

/**
 * Writes wait on this. A purge is fired without being awaited when the identity changes,
 * so a fast re-login would otherwise have its first writes deleted by the purge of the
 * account that just left.
 */
export async function whenPurgesSettled(): Promise<void> {
  while (pending.size > 0) await Promise.all([...pending]);
}
