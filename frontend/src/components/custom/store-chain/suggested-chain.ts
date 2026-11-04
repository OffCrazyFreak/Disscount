/** Shown, never saved, because viewing a list must not write to it and a default keeps following today's cheapest; a ticked item never borrows one. */
export function suggestedChain(
  savedChain: string | null | undefined,
  isChecked: boolean,
  cheapestChain: string | null | undefined,
): string | null {
  return !savedChain && !isChecked ? (cheapestChain ?? null) : null;
}
