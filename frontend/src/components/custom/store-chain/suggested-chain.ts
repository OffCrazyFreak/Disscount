/**
 * The chain shown, never saved, for an item with none chosen: viewing a list must not
 * write to it, and an unsaved default keeps following whichever chain is cheapest today.
 * A ticked item records where it was bought, so it never borrows a default.
 */
export function suggestedChain(
  savedChain: string | null | undefined,
  isChecked: boolean,
  cheapestChain: string | null | undefined,
): string | null {
  return !savedChain && !isChecked ? (cheapestChain ?? null) : null;
}
