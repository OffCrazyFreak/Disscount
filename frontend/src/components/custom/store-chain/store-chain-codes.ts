import { storeNamesMap } from "@/constants/name-mappings";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

/** Every chain we know, for an item with no prices to pick a store from. */
export const ALL_CHAIN_CODES = Object.keys(storeNamesMap).sort((a, b) =>
  compareHr(getChainLabel(a), getChainLabel(b)),
);

/** Built from live price data, so even chains we have not mapped stay selectable. */
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
