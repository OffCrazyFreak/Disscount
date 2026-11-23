const pending = new Set<Promise<unknown>>();
let generation = 0;

/** Registered synchronously when a purge starts, so no write can slip in before it. */
export function trackPurge(purge: Promise<unknown>) {
  generation += 1;

  const tracked = purge.then(
    () => undefined,
    () => undefined,
  );
  pending.add(tracked);
  void tracked.then(() => pending.delete(tracked));
}

/** Comparing accounts is not enough, because a sign out and back in as the same user leaves the identity unchanged. */
export function currentPurgeGeneration(): number {
  return generation;
}

/** A purge on identity change is not awaited, so this stops it deleting a fast re-login's writes. */
export async function canWriteAfterPurges(captured: number): Promise<boolean> {
  while (pending.size > 0) await Promise.all([...pending]);
  return generation === captured;
}
