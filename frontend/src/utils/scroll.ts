/** Returns the window to the top, animating unless the user opted out */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
