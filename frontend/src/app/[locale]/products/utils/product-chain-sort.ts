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

/** "stores" follows preferences; "price" leads with the store worth a detour; "distance" the nearest. */
export function compareProductChains(
  a: ChainProductResponse,
  b: ChainProductResponse,
  pinnedStoreIds: string[],
  mode: ProductChainSortMode,
  distances?: Map<string, number>,
): number {
  if (mode === "distance") {
    const difference =
      (distances?.get(a.chain) ?? Infinity) -
      (distances?.get(b.chain) ?? Infinity);

    // Infinity minus Infinity is NaN: two unlocated chains tie on distance.
    if (difference) return difference;
  }

  if (mode === "stores") {
    const aIsPinned = pinnedStoreIds.includes(a.chain);
    const bIsPinned = pinnedStoreIds.includes(b.chain);

    if (aIsPinned !== bIsPinned) return aIsPinned ? -1 : 1;
  }

  const readers: PriceReader[] =
    mode === "stores"
      ? [avgPrice, minPrice, maxPrice]
      : [minPrice, avgPrice, maxPrice];

  for (const read of readers) {
    const difference = read(a) - read(b);

    if (difference !== 0) return difference;
  }

  return compareHr(getChainLabel(a.chain), getChainLabel(b.chain));
}
