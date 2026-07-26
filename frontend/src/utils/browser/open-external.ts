/**
 * Opens a third-party page in a new tab. Unlike `<a target="_blank">`, which
 * implies it, `window.open` leaves the opened page a live `window.opener` handle
 * it could navigate this tab with.
 */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
