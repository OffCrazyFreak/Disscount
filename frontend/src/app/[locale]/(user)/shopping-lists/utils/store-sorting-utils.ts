import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { getChainAvgPriceRange } from "@/app/[locale]/products/utils/product-utils";
import { compareHr } from "@/utils/strings";

/**
 * Modes for optimising the store list on a shopping list.
 * Kept as a const tuple so the type and localStorage validation share one source.
 */
export const STORE_OPTIMIZE_MODES = [
  "products",
  "basket",
  "total",
  "distance",
] as const;

export type StoreOptimizeMode = (typeof STORE_OPTIMIZE_MODES)[number];

export function isStoreOptimizeMode(
  value: string | undefined,
): value is StoreOptimizeMode {
  return !!value && (STORE_OPTIMIZE_MODES as readonly string[]).includes(value);
}

type RankedChain = ChainProductResponse & { itemCount: number };

function avgPrice(chain: RankedChain): number {
  return parseFloat(chain.avg_price);
}

// A few hundred metres rarely decide a trip with a whole list, so stores in
// the same band compete on how much of the list they carry.
const DISTANCE_BAND_KM = 0.5;

interface IRankContext {
  cheapestCountByChain?: Map<string, number>;
  distanceByChain?: Map<string, number>;
}

/** Sort keys per mode, compared in order, smaller first. */
const MODE_KEYS: Record<
  StoreOptimizeMode,
  (chain: RankedChain, context: IRankContext) => number[]
> = {
  products: (chain) => [-chain.itemCount],
  // Completeness first, then price within each tier.
  basket: (chain) => [-chain.itemCount, avgPrice(chain)],
  // Most rock-bottom prices first, for a shopper willing to hit several stores.
  total: (chain, { cheapestCountByChain }) => [
    -(cheapestCountByChain?.get(chain.chain) ?? 0),
    avgPrice(chain),
  ],
  // Nearest band first, chains without a located store last, then
  // completeness and price within a band.
  distance: (chain, { distanceByChain }) => [
    Math.floor(
      (distanceByChain?.get(chain.chain) ?? Infinity) / DISTANCE_BAND_KM,
    ),
    -chain.itemCount,
    avgPrice(chain),
  ],
};

function rankKeys(
  chain: RankedChain,
  pinnedStoreIds: string[],
  mode: StoreOptimizeMode,
  context: IRankContext,
): number[] {
  const modeKeys = MODE_KEYS[mode] ?? MODE_KEYS.products;
  // Distance is about where the shopper stands, so a pin does not outrank it.
  const pinnedKey =
    mode !== "distance" && pinnedStoreIds.includes(chain.chain) ? 0 : 1;

  return [pinnedKey, ...modeKeys(chain, context)];
}

/**
 * Comparator function for sorting store chains by the selected optimisation mode.
 * Pinned stores come first (user preference) in every mode but "distance", then the
 * chosen metric, then the chain name (Croatian locale).
 * @param a First chain to compare
 * @param b Second chain to compare
 * @param pinnedStoreIds Array of pinned store IDs
 * @param mode The optimisation metric to rank by (defaults to product count)
 * @param cheapestCountByChain How many list products are cheapest at each chain
 *        (only used by the "total" mode)
 * @param distanceByChain Kilometres to each chain's nearest store (only used by the
 *        "distance" mode)
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function compareStoreChains(
  a: RankedChain,
  b: RankedChain,
  pinnedStoreIds: string[],
  mode: StoreOptimizeMode = "products",
  cheapestCountByChain?: Map<string, number>,
  distanceByChain?: Map<string, number>,
): number {
  const context = { cheapestCountByChain, distanceByChain };
  const aKeys = rankKeys(a, pinnedStoreIds, mode, context);
  const bKeys = rankKeys(b, pinnedStoreIds, mode, context);
  const index = aKeys.findIndex((key, i) => key !== bKeys[i]);

  if (index !== -1) return aKeys[index] - bKeys[index];

  return compareHr(a.chain, b.chain);
}

/**
 * How much you save on an item by buying it at the given chain, as a percentage
 * below the highest price for that product across all chains (so a bigger number
 * means a bigger discount at this store). Returns -Infinity when the item is not
 * sold at this chain, so unavailable items sort last.
 */
function getItemSavingPercentAtChain(
  item: ShoppingListItemDto,
  productsData: ProductResponse[],
  chainCode: string,
): number {
  const product = productsData.find((p) => p?.ean === item.ean);
  const chainData = product?.chains?.find((c) => c.chain === chainCode);
  if (!chainData) return -Infinity;

  const price = parseFloat(chainData.avg_price);
  const maxPrice = getChainAvgPriceRange(product)?.max ?? 0;

  if (!maxPrice || isNaN(price)) return 0;

  return ((maxPrice - price) / maxPrice) * 100;
}

/**
 * Comparator for sorting a store's products: not-yet-bought items first, then by
 * biggest saving at this store (the most-discounted product on top), then name.
 */
export function sortShoppingListItemsByPurchaseAndSaving(
  a: ShoppingListItemDto,
  b: ShoppingListItemDto,
  productsData: ProductResponse[],
  chain: ChainProductResponse,
): number {
  // 1. Not-yet-bought items come first
  if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;

  // 2. Bigger saving at this store first
  const savingA = getItemSavingPercentAtChain(a, productsData, chain.chain);
  const savingB = getItemSavingPercentAtChain(b, productsData, chain.chain);
  if (savingA !== savingB) return savingB - savingA;

  // 3. Alphabetical (Croatian locale)
  return compareHr(a.name, b.name);
}
