// Read-once stash for the optimistic-close save pattern: entity modals unmount
// when they close, so a failed mutation stashes its error here, reopens the
// modal via URL, and the remounted form picks the error up exactly once.
const stash = new Map<string, unknown>();

export function stashModalError(key: string, error: unknown): void {
  stash.set(key, error);
}

export function takeModalError(key: string): unknown {
  const error = stash.get(key);
  stash.delete(key);
  return error;
}
