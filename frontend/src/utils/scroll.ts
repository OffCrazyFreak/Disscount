function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Browsers apply the reduced-motion preference to the CSS scroll-behavior
 * property and never to a scripted scroll, so it has to be checked here.
 */
export function scrollWindowTo(top: number): void {
  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

export function scrollToTop(): void {
  scrollWindowTo(0);
}
