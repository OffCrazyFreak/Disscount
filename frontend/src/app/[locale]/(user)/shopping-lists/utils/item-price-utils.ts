import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { isPinnedChain } from "@/utils/pinned-stores";

// Guarded against nullish chains although the declared type forbids them. These
// two are called straight from useShoppingListData with no wrapping guard, and a
// throw there takes the whole price calculation down.
export function getStorePricesFromProduct(
  productData: ProductResponse,
): Record<string, number> {
  const storePrices: Record<string, number> = {};

  for (const chain of productData.chains ?? []) {
    storePrices[chain.chain] = parseFloat(chain.avg_price);
  }

  return storePrices;
}

function pickCheapestChain(chains: ProductResponse["chains"]): string | null {
  let cheapestChain: string | null = null;
  let cheapestPrice = Infinity;

  for (const chainProduct of chains) {
    const price = parseFloat(chainProduct.avg_price);

    if (price < cheapestPrice) {
      cheapestPrice = price;
      cheapestChain = chainProduct.chain;
    }
  }

  return cheapestChain;
}

export function findCheapestStoreFromProduct(
  productData: ProductResponse,
  pinnedStores: PinnedStoreDto[] | null | undefined,
): string | null {
  if (!productData.chains || productData.chains.length === 0) {
    return null;
  }

  if (pinnedStores && pinnedStores.length > 0) {
    const pinnedNames = pinnedStores.map((store) => store.storeName);
    const pinnedChains = productData.chains.filter((chainProduct) =>
      isPinnedChain(chainProduct.chain, pinnedNames),
    );

    const cheapestPinned = pickCheapestChain(pinnedChains);
    if (cheapestPinned) return cheapestPinned;
  }

  return pickCheapestChain(productData.chains);
}
