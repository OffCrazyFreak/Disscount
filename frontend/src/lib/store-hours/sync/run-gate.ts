// A real chain closes a handful of stores a week; losing over a third of
// them at once means the page changed or the parser broke.
const MAX_DROP = 0.3;

export type RunStatus = "accepted" | "rejected" | "failed" | "disabled";

/**
 * Accepts a run unless it matched no store or far fewer than the last
 * accepted run, so a redesigned page keeps last week's hours instead of
 * wiping the chain.
 */
export function gateRun(
  count: number,
  acceptedCount: number | null,
): RunStatus {
  if (count === 0) return "rejected";
  if (acceptedCount && count < acceptedCount * (1 - MAX_DROP))
    return "rejected";

  return "accepted";
}
