/** Unlike `<a target="_blank">`, `window.open` leaves the opened page a live `window.opener` handle it could navigate this tab with. */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
