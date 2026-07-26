/**
 * Scrolls the window, animating unless the user opted out. Browsers honour
 * prefers-reduced-motion for the CSS `scroll-behavior` property but not for this
 * option, so the choice has to be made explicitly.
 */
/** Far enough down that offering a way back answers a real problem */
export const BACK_TO_TOP_THRESHOLD_PX = 600;

export function scrollWindowTo(top: number): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

/** Returns the window to the top, animating unless the user opted out */
export function scrollToTop(): void {
  scrollWindowTo(0);
}
