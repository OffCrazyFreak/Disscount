import type { ChainProductResponse } from "@/lib/cijene-api/schemas";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

export const PRODUCT_CHAIN_SORT_MODES = [
  "stores",
  "price",
  "distance",
] as const;

export type ProductChainSortMode = (typeof PRODUCT_CHAIN_SORT_MODES)[number];

type PriceReader = (chain: ChainProductResponse) => number;

const minPrice: PriceReader = (chain) => parseFloat(chain.min_price);
const avgPrice: PriceReader = (chain) => parseFloat(chain.avg_price);
const maxPrice: PriceReader = (chain) => parseFloat(chain.max_price);

/**
 * Order the chains carrying one product.
 *
 * "stores" follows the user's preferences: pinned chains lead, then whichever
 * charges least on average. "price" ignores preferences entirely and leads
 * with the chain holding the single cheapest store, which is the one worth
 * a detour.
 */
export function compareProductChains(
  a: ChainProductResponse,
  b: ChainProductResponse,
  pinnedStoreIds: string[],
  mode: ProductChainSortMode,
): number {
  if (mode === "stores") {
    const aIsPinned = pinnedStoreIds.includes(a.chain);
    const bIsPinned = pinnedStoreIds.includes(b.chain);

    if (aIsPinned !== bIsPinned) return aIsPinned ? -1 : 1;
  }

  const readers: PriceReader[] =
    mode === "price"
      ? [minPrice, avgPrice, maxPrice]
      : [avgPrice, minPrice, maxPrice];

  for (const read of readers) {
    const difference = read(a) - read(b);

    if (difference !== 0) return difference;
  }

  return compareHr(getChainLabel(a.chain), getChainLabel(b.chain));
}
