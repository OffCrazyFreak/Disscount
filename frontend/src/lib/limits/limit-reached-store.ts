import type { LimitReachedProblem } from "@/lib/api/schemas/user-limit";

interface ILimitReachedState {
  open: boolean;
  // Kept after close, so the exit animation still shows the copy it opened with.
  problem: LimitReachedProblem | null;
}

const CLOSED: ILimitReachedState = { open: false, problem: null };

// Module state, because the query client's error hook runs outside React and must open the dialog.
let state = CLOSED;
const listeners = new Set<() => void>();

function setState(next: ILimitReachedState) {
  state = next;
  for (const listener of listeners) listener();
}

export function showLimitReached(problem: LimitReachedProblem) {
  setState({ open: true, problem });
}

export function dismissLimitReached() {
  setState({ ...state, open: false });
}

export function subscribeLimitReached(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLimitReached() {
  return state;
}

export function getServerLimitReached() {
  return CLOSED;
}
