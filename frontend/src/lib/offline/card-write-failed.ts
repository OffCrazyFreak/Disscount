import { toast } from "sonner";

import { parseProblem } from "@/lib/api/problem-details";

/**
 * Sibling of list-write-failed for the wallet. Same rule applies: call it from a hook's
 * own onError as well as registering it as a replay default, because a hook-level onError
 * replaces the default rather than running beside it.
 *
 * A card is only ever the owner's, so there is no lost-access case to distinguish, unlike
 * a shared list.
 */
export function cardWriteFailed(error: Error) {
  const status = parseProblem(error)?.status;

  toast.error(
    status === 404
      ? "Kartica više ne postoji."
      : "Promjena kartice nije spremljena. Pokušaj ponovno.",
  );
}

/** A replayed delete 404s when the card is already gone, which is the desired end state. */
export function cardDeleteFailed(error: Error) {
  if (parseProblem(error)?.status === 404) return;

  toast.error("Kartica nije obrisana. Pokušaj ponovno.");
}
