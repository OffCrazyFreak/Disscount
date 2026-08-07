import { toast } from "sonner";

import { parseProblem } from "@/lib/api/problem-details";

/**
 * Access to a list you reached by link can be withdrawn between queuing a write and
 * replaying it, and the owner is under no obligation to warn anyone. Saying so beats a
 * silent revert. The owner's own writes run through here too and simply never hit the
 * branch, since an owner cannot lose access to their own list.
 *
 * Called from the hooks' own onError as well as the replay defaults. A hook-level
 * onError replaces the mutation default's rather than running alongside it, so a handler
 * registered only as a default never fires for a failure that happens while the page is
 * still open, which is the common case.
 *
 * Only 403 is read as lost access. This runs for live failures too, so blaming access
 * loss for every error told a collaborator with perfectly good access that they had lost
 * it because a request timed out.
 */
export function listWriteFailed(error: Error) {
  const lostAccess = parseProblem(error)?.status === 403;

  toast.error(
    lostAccess
      ? "Promjena nije spremljena. Možda više nemaš pristup ovom popisu."
      : "Promjena nije spremljena. Pokušaj ponovno.",
  );
}

/**
 * A delete cannot tell "the item is already gone" from "the list is gone" by status
 * alone, and the first is a success. So 404 says nothing at all, and only a 403 is
 * reported as lost access.
 */
export function deleteWriteFailed(error: Error) {
  const status = parseProblem(error)?.status;
  if (status === 404) return;

  toast.error(
    status === 403
      ? "Promjena nije spremljena. Možda više nemaš pristup ovom popisu."
      : "Promjena nije spremljena. Pokušaj ponovno.",
  );
}
