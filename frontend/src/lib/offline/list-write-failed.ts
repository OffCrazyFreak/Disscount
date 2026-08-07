import { toast } from "sonner";

import { parseProblem } from "@/lib/api/problem-details";

/**
 * Must be called from a hook's own onError as well as registered as a replay default: a
 * hook-level onError replaces the default rather than running beside it.
 */
export function listWriteFailed(error: Error) {
  const lostAccess = parseProblem(error)?.status === 403;

  toast.error(
    lostAccess
      ? "Promjena nije spremljena. Možda više nemaš pristup ovom popisu."
      : "Promjena nije spremljena. Pokušaj ponovno.",
  );
}

/** A replayed delete 404s when the item is already gone, which is the desired end state. */
export function deleteWriteFailed(error: Error) {
  const status = parseProblem(error)?.status;
  if (status === 404) return;

  toast.error(
    status === 403
      ? "Promjena nije spremljena. Možda više nemaš pristup ovom popisu."
      : "Promjena nije spremljena. Pokušaj ponovno.",
  );
}
