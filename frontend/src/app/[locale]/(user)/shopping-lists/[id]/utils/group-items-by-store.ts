import type { ShoppingListItemDto } from "@/lib/api/types";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

export interface IStoreGroup {
  /** Null for items with no chosen chain and no known cheapest one. */
  chain: string | null;
  items: ShoppingListItemDto[];
  /** What the group costs at that chain, from the prices known so far. */
  subtotal: number;
  /** True when some item has no price at that chain, so the subtotal is low. */
  isPartial: boolean;
}

interface IGroupInput {
  items: ShoppingListItemDto[];
  cheapestStores: Record<string, string>;
  storePrices: Record<string, Record<string, number>>;
}

/**
 * Splits a list by where each item will be bought: its chosen chain, else its
 * cheapest one. Chains run A to Z, items A to Z within them, and items with
 * neither come last.
 */
export function groupItemsByStore({
  items,
  cheapestStores,
  storePrices,
}: IGroupInput): IStoreGroup[] {
  const byChain = new Map<string | null, ShoppingListItemDto[]>();

  for (const item of items) {
    const chain = item.chainCode ?? cheapestStores[item.id] ?? null;
    byChain.set(chain, [...(byChain.get(chain) ?? []), item]);
  }

  return [...byChain.entries()]
    .sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return compareHr(getChainLabel(a), getChainLabel(b));
    })
    .map(([chain, groupItems]) => {
      let subtotal = 0;
      let isPartial = false;

      for (const item of groupItems) {
        // A checked item keeps the price it was bought at.
        const price = item.isChecked
          ? item.storePrice
          : chain
            ? storePrices[item.id]?.[chain]
            : undefined;

        if (price == null) isPartial = true;
        else subtotal += price * (item.amount || 1);
      }

      return {
        chain,
        items: [...groupItems].sort((a, b) => compareHr(a.name, b.name)),
        subtotal,
        isPartial,
      };
    });
}
