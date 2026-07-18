import { ShoppingListItemDto } from "@/lib/api/types";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  ChainSummary,
  ICompleteStoresAnalysis,
} from "@/app/(user)/shopping-lists/[id]/components/stores/store-chain-types";

// Collect all unique chains from all products, summing each not-yet-bought
// item's price (times its amount) into per-chain min/avg/max totals.
export function buildChainAggregates(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): ChainSummary[] {
  if (productsData.length === 0) return [];

  const chainMap = new Map<
    string,
    {
      chain: string;
      totalMin: number;
      totalAvg: number;
      totalMax: number;
      itemCount: number;
    }
  >();

  productsData.forEach((product) => {
    if (!product) return;

    product.chains.forEach((chain) => {
      const shoppingItem = activeItems.find((item) => item.ean === product.ean);
      if (!shoppingItem) return;

      const quantity = shoppingItem.amount || 1;
      const minPrice = parseFloat(chain.min_price) * quantity;
      const avgPrice = parseFloat(chain.avg_price) * quantity;
      const maxPrice = parseFloat(chain.max_price) * quantity;

      if (chainMap.has(chain.chain)) {
        const existing = chainMap.get(chain.chain)!;
        existing.totalMin += minPrice;
        existing.totalAvg += avgPrice;
        existing.totalMax += maxPrice;
        existing.itemCount += 1;
      } else {
        chainMap.set(chain.chain, {
          chain: chain.chain,
          totalMin: minPrice,
          totalAvg: avgPrice,
          totalMax: maxPrice,
          itemCount: 1,
        });
      }
    });
  });

  return Array.from(chainMap.values()).map(
    (chainData): ChainSummary => ({
      chain: chainData.chain,
      code: "",
      name: "",
      brand: null,
      category: null,
      unit: null,
      quantity: null,
      min_price: chainData.totalMin.toFixed(2),
      avg_price: chainData.totalAvg.toFixed(2),
      max_price: chainData.totalMax.toFixed(2),
      price_date: new Date()
        .toISOString()
        .split("T")[0] as `${number}-${number}-${number}`,
      itemCount: chainData.itemCount,
    }),
  );
}

// Among stores that carry every not-yet-bought item, find the cheapest and
// most expensive by average total price.
export function findCompleteStoresAnalysis(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): ICompleteStoresAnalysis {
  if (activeItems.length === 0) {
    return { bestStore: null, worstStore: null };
  }

  const totalItems = activeItems.length;
  const completeStores = allChains.filter(
    (chain) => chain.itemCount === totalItems,
  );

  if (completeStores.length === 0) {
    return { bestStore: null, worstStore: null };
  }

  const bestStore = completeStores.reduce((best, current) => {
    const bestPrice = parseFloat(best.avg_price);
    const currentPrice = parseFloat(current.avg_price);
    return currentPrice < bestPrice ? current : best;
  });

  const worstStore = completeStores.reduce((worst, current) => {
    const worstPrice = parseFloat(worst.avg_price);
    const currentPrice = parseFloat(current.avg_price);
    return currentPrice > worstPrice ? current : worst;
  });

  return { bestStore, worstStore };
}

// Count, per chain, how many list products are cheapest (global minimum) at
// that chain.
export function countCheapestByChain(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): Map<string, number> {
  const counts = new Map<string, number>();

  activeItems.forEach((item) => {
    const product = productsData.find((p) => p?.ean === item.ean);
    if (!product || !product.chains || product.chains.length === 0) return;

    const chainPrices = product.chains
      .map((chain) => parseFloat(chain.avg_price))
      .filter((price) => !isNaN(price));

    if (chainPrices.length === 0) return;

    const minPrice = Math.min(...chainPrices);

    product.chains.forEach((chain) => {
      if (parseFloat(chain.avg_price) === minPrice) {
        counts.set(chain.chain, (counts.get(chain.chain) || 0) + 1);
      }
    });
  });

  return counts;
}

// Chains that offer the highest price for at least one not-yet-bought item.
export function findHighestPriceStores(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): Set<string> {
  const highestPriceStores = new Set<string>();

  activeItems.forEach((item) => {
    const product = productsData.find((p) => p?.ean === item.ean);
    if (!product || !product.chains || product.chains.length === 0) return;

    const allChainPrices = product.chains
      .map((c) => parseFloat(c.avg_price))
      .filter((p) => !isNaN(p));

    if (allChainPrices.length === 0) return;

    const maxPrice = Math.max(...allChainPrices);

    product.chains.forEach((chain) => {
      const chainPrice = parseFloat(chain.avg_price);
      if (chainPrice === maxPrice) {
        highestPriceStores.add(chain.chain);
      }
    });
  });

  return highestPriceStores;
}

// Absolute global min/max across ALL price types, considering only stores that
// carry every not-yet-bought item.
export function computeAbsolutePrices(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): { min: number; max: number } {
  if (activeItems.length === 0) {
    return { min: 0, max: 0 };
  }

  const totalItems = activeItems.length;
  const completeChains = allChains.filter(
    (chain) => chain.itemCount === totalItems,
  );

  if (completeChains.length === 0) return { min: 0, max: 0 };

  const allPrices: number[] = [];
  completeChains.forEach((chain) => {
    allPrices.push(parseFloat(chain.min_price));
    allPrices.push(parseFloat(chain.avg_price));
    allPrices.push(parseFloat(chain.max_price));
  });

  return {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices),
  };
}
