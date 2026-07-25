/**
 * prefers-reduced-motion applies to the CSS scroll-behavior property and never to
 * a scripted scroll's behavior option, so the caller has to read it and pass it.
 */
export function scrollWindowTo(top: number, reduced = false): void {
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

export function scrollToTop(reduced = false): void {
  scrollWindowTo(0, reduced);
}
