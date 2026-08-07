export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

type ShareData =
  | { title: string; text: string; url?: string }
  | { title: string; text?: string; url: string };

/**
 * AbortError is the user closing the sheet. InvalidStateError is a second share
 * fired while one is still open, so the first sheet is still up and handling it:
 * falling through to the clipboard there would copy behind the user's back and
 * claim success for a share they have not finished making yet.
 */
function isDismissal(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "InvalidStateError")
  );
}

/**
 * Shares through the OS sheet where there is one, then copies the URL or shared
 * text where there is not. Returns the outcome rather than showing a toast, so
 * callers keep their own wording.
 *
 * Carries no pending state and no caller should add one: navigator.share does
 * not reliably settle when the sheet is dismissed on mobile, so a flag cleared
 * on completion strands the control spinning until a reload.
 */
export async function shareOrCopy(data: ShareData): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "failed";

  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      // Dismissing the sheet is a choice, not a failure to fall back from.
      // Anything else is a real failure, so the clipboard below still runs.
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
