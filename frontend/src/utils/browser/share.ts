export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

interface IShareData {
  title: string;
  url: string;
}

/**
 * Shares through the OS sheet where there is one, and copies the link where there
 * is not. Returns the outcome rather than showing a toast, so callers keep their
 * own wording.
 */
export async function shareOrCopy(data: IShareData): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "failed";

  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch {
      // Dismissing the sheet is a choice, not a failure to fall back from.
      return "dismissed";
    }
  }

  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}
