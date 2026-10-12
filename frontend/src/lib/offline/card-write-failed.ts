import { toast } from "sonner";

import { parseProblem } from "@/lib/api/problem-details";

/**
 * Must be called from a hook's own onError as well as registered as a replay default: a
 * hook-level onError replaces the default rather than running beside it.
 */
export function cardWriteFailed(error: Error) {
  const status = parseProblem(error)?.status;

  if (status === 409) {
    toast.error("Dosegnut je najveći broj kartica.");
    return;
  }

  toast.error("Kartica nije spremljena. Pokušaj ponovno.");
}

/** A replayed delete 404s when the card is already gone, which is the desired end state. */
export function cardDeleteFailed(error: Error) {
  if (parseProblem(error)?.status === 404) return;

  toast.error("Kartica nije obrisana. Pokušaj ponovno.");
}
