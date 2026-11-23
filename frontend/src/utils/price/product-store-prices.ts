import { PinnedStoreDto } from "@/lib/api/schemas/user/preferences";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { isPinnedChain } from "@/utils/geo/pinned-stores";

export function getStorePricesFromProduct(
  productData: ProductResponse,
): Record<string, number> {
  const storePrices: Record<string, number> = {};

  for (const chain of productData.chains) {
    storePrices[chain.chain] = chain.avg_price;
  }

  return storePrices;
}

function pickCheapestChain(chains: ProductResponse["chains"]): string | null {
  let cheapestChain: string | null = null;
  let cheapestPrice = Infinity;

  for (const chainProduct of chains) {
    const price = chainProduct.avg_price;

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
