/** Shown, never saved: viewing must not write, and a default follows today's cheapest. */
export function suggestedChain(
  savedChain: string | null | undefined,
  isChecked: boolean,
  cheapestChain: string | null | undefined,
): string | null {
  return !savedChain && !isChecked ? (cheapestChain ?? null) : null;
}
