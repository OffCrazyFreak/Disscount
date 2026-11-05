/** Browsers honour prefers-reduced-motion for CSS `scroll-behavior` but not this option, so choose here. */
/** Far enough down that offering a way back answers a real problem */
export const BACK_TO_TOP_THRESHOLD_PX = 600;

export function scrollWindowTo(top: number): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

export function scrollToTop(): void {
  scrollWindowTo(0);
}
