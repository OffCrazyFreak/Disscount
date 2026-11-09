import { toast } from "sonner";

import { isSessionChanged, problemMessage } from "@/lib/api/problem-details";
import { cardWriteMessage, httpStatus } from "@/lib/offline/failure-policy";

// So a caller can hand in a stable wrapper that always reads the current language.
export type CardToastTranslator = (
  key:
    "offline.cardLimit" | "offline.cardSaveFailed" | "offline.cardDeleteFailed",
) => string;

// Failed only because the tab is switching accounts; the proxy's refusal carries the translation.
function failureText(error: Error, message: string): string {
  return isSessionChanged(error) ? problemMessage(error, message) : message;
}

/** Also call from a hook's own onError, which replaces this default rather than running beside it. */
export function cardWriteFailed(error: Error, t: CardToastTranslator) {
  const key = cardWriteMessage(error);
  if (key) toast.error(failureText(error, t(key)));
}

/** A replayed delete 404s when the card is already gone, which is the desired end state. */
export function cardDeleteFailed(error: Error, t: CardToastTranslator) {
  if (httpStatus(error) === 404) return;

  toast.error(failureText(error, t("offline.cardDeleteFailed")));
}
