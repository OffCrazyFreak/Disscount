export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

type ShareData =
  | { title: string; text: string; url?: string }
  | { title: string; text?: string; url: string };

/** AbortError is a closed sheet; InvalidStateError is a second share while one is open, and the clipboard would then copy behind the user's back. */
function isDismissal(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "InvalidStateError")
  );
}

/** Never add a pending state: navigator.share does not reliably settle on dismissal on mobile, so a flag strands the control spinning. */
export async function shareOrCopy(data: ShareData): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "failed";

  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      // Dismissing is a choice, not a failure to fall back from; anything else is real, so the clipboard below still runs.
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
