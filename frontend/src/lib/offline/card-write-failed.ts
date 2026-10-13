import { toast } from "sonner";

import { cardWriteMessage, httpStatus } from "@/lib/offline/failure-policy";

// Only the keys these toasts use, so a caller can hand in a stable wrapper that
// always reads the current language.
export type CardToastTranslator = (
  key:
    "offline.cardLimit" | "offline.cardSaveFailed" | "offline.cardDeleteFailed",
) => string;

/**
 * Must be called from a hook's own onError as well as registered as a replay default: a
 * hook-level onError replaces the default rather than running beside it.
 */
export function cardWriteFailed(error: Error, t: CardToastTranslator) {
  const key = cardWriteMessage(error);
  if (key) toast.error(t(key));
}

/** A replayed delete 404s when the card is already gone, which is the desired end state. */
export function cardDeleteFailed(error: Error, t: CardToastTranslator) {
  if (httpStatus(error) === 404) return;

  toast.error(t("offline.cardDeleteFailed"));
}
