import { toast } from "sonner";

import { parseProblem } from "@/lib/api/problem-details";

// Only the keys these toasts use, so a caller can hand in a stable wrapper that
// always reads the current language.
export type OfflineToastTranslator = (
  key:
    | "offline.writeFailed"
    | "offline.writeFailedLostAccess"
    | "offline.retiredWriteDropped",
) => string;

/**
 * Must be called from a hook's own onError as well as registered as a replay default: a
 * hook-level onError replaces the default rather than running beside it.
 */
export function listWriteFailed(error: Error, t: OfflineToastTranslator) {
  const lostAccess = parseProblem(error)?.status === 403;

  toast.error(
    lostAccess ? t("offline.writeFailedLostAccess") : t("offline.writeFailed"),
  );
}

/** A replayed delete 404s when the item is already gone, which is the desired end state. */
export function deleteWriteFailed(error: Error, t: OfflineToastTranslator) {
  const status = parseProblem(error)?.status;
  if (status === 404) return;

  toast.error(
    status === 403
      ? t("offline.writeFailedLostAccess")
      : t("offline.writeFailed"),
  );
}
