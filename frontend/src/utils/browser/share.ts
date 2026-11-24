export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

type ShareData =
  | { title: string; text: string; url?: string }
  | { title: string; text?: string; url: string };

/** AbortError is a closed sheet; InvalidStateError a second share, where the clipboard would copy unasked. */
function isDismissal(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "InvalidStateError")
  );
}

/** Never add a pending state: navigator.share may not settle on mobile dismissal, leaving a spinner. */
export async function shareOrCopy(data: ShareData): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "failed";

  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      // Dismissing is a choice, not a failure; anything else is real, so the clipboard below still runs.
      if (isDismissal(error)) return "dismissed";
    }
  }

  const clipboardValue = data.url ?? data.text;
  if (!clipboardValue) return "failed";

  try {
    await navigator.clipboard.writeText(clipboardValue);
    return "copied";
  } catch {
    return "failed";
  }
}
