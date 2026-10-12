const tails = new Map<string, Promise<unknown>>();

/** Runs tasks for one key strictly in order, so a stale photo send cannot land after a newer choice. */
export function runExclusive<T>(key: string, task: () => Promise<T>) {
  const run = (tails.get(key) ?? Promise.resolve()).then(task, task);
  const tail = run.catch(() => undefined);

  tails.set(key, tail);
  void tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });

  return run;
}

export const photoSlotKey = (cardId: string, slot: string) =>
  `${cardId}:${slot}`;
