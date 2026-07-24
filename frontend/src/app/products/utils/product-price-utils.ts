import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

const minPriceCache = new WeakMap<ProductResponse, number>();
const maxPriceCache = new WeakMap<ProductResponse, number>();
const avgPriceCache = new WeakMap<ProductResponse, number>();

export function parsePrice(value: string): number | null {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function getMinPrice(product: ProductResponse): number {
  if (minPriceCache.has(product)) {
    return minPriceCache.get(product)!;
  }

  const prices = product.chains
    .map((c) => parseFloat(c.min_price))
    .filter((price) => Number.isFinite(price));
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const finalMin = Number.isFinite(min) ? min : 0;

  minPriceCache.set(product, finalMin);
  return finalMin;
}

export function getMaxPrice(product: ProductResponse): number {
  if (maxPriceCache.has(product)) {
    return maxPriceCache.get(product)!;
  }

  const prices = product.chains
    .map((c) => parseFloat(c.max_price))
    .filter((price) => Number.isFinite(price));
  const max = prices.length > 0 ? Math.max(...prices) : 0;
  const finalMax = Number.isFinite(max) ? max : 0;

  maxPriceCache.set(product, finalMax);
  return finalMax;
}

export function getAveragePrice(product: ProductResponse): number {
  if (avgPriceCache.has(product)) {
    return avgPriceCache.get(product)!;
  }

  if (product.chains.length > 0) {
    let sum = 0;
    let count = 0;

    for (const chain of product.chains) {
      const parsed = parseFloat(chain.avg_price);
      if (Number.isFinite(parsed)) {
        sum += parsed;
        count += 1;
      }
    }

    const avg = sum / count;
    if (Number.isFinite(avg)) {
      avgPriceCache.set(product, avg);
      return avg;
    }
  }

  return 0;
}

export function getCheapestChainByMinPrice(
  chains: ChainProductResponse[],
): { chain: ChainProductResponse; price: number } | null {
  const pricedChains: Array<{ chain: ChainProductResponse; price: number }> =
    [];

  for (const chain of chains) {
    const price = parsePrice(chain.min_price);

    if (price !== null) {
      pricedChains.push({ chain, price });
    }
  }

  if (pricedChains.length === 0) {
    return null;
  }

  return pricedChains.reduce((lowest, current) =>
    current.price < lowest.price ? current : lowest,
  );
}
