import { toast } from "sonner";

import { cardWriteMessage } from "@/lib/offline/failure-policy";
import { parseProblem } from "@/lib/api/problem-details";

/**
 * Must be called from a hook's own onError as well as registered as a replay default: a
 * hook-level onError replaces the default rather than running beside it.
 */
export function cardWriteFailed(error: Error) {
  const message = cardWriteMessage(error);
  if (message) toast.error(message);
}

/** A replayed delete 404s when the card is already gone, which is the desired end state. */
export function cardDeleteFailed(error: Error) {
  if (parseProblem(error)?.status === 404) return;

  toast.error("Kartica nije obrisana. Pokušaj ponovno.");
}
