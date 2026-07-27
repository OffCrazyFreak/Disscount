export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

interface IShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * Shares through the OS sheet where there is one, and copies the link where there
 * is not. Returns the outcome rather than showing a toast, so callers keep their
 * own wording.
 */
function isDismissal(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function shareOrCopy(data: IShareData): Promise<ShareOutcome> {
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

  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}
