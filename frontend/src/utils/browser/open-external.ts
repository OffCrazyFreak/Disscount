/** Unlike `<a target="_blank">`, `window.open` leaves the page a `window.opener` that could navigate this tab. */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
