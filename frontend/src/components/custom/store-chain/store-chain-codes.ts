import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

/**
 * Built from live price data, so even chains we have not mapped stay selectable.
 * When checked, only the chosen store is offered; otherwise all priced stores plus the current selection.
 */
export function availableChainCodes(
  isChecked: boolean,
  value: string | null | undefined,
  storePrices: Record<string, number>,
): string[] {
  const selected = value ? [value] : [];
  const codes = isChecked
    ? selected
    : Array.from(new Set([...Object.keys(storePrices), ...selected]));

  return codes.sort((a, b) => compareHr(getChainLabel(a), getChainLabel(b)));
}
