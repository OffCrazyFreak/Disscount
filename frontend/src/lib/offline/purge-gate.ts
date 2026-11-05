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

/**
 * Taken by a writer before its async work, together with the data it will write.
 * Comparing accounts is not enough: a purge of the same account (sign out, then back in
 * as the same user) leaves the identity unchanged.
 */
export function currentPurgeGeneration(): number {
  return generation;
}

/**
 * Waits for running purges, then says whether the write may land. A purge is fired
 * without being awaited when the identity changes, so a fast re-login would otherwise
 * have its first writes deleted by the purge of the account that just left. False when
 * any purge started after `captured`: the data belongs to what that purge cleared.
 */
export async function canWriteAfterPurges(captured: number): Promise<boolean> {
  while (pending.size > 0) await Promise.all([...pending]);
  return generation === captured;
}
