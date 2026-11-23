import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";

/** `price_date` is a Croatian calendar date, whatever zone the device runs in. */
export function isPriceDateToday(priceDate: string): boolean {
  return priceDate === zagrebClock(new Date()).date;
}

/** ISO dates sort as text, so the largest is the day a chain last published this product's prices. */
export function getNewestPriceDate(product: ProductResponse): string | null {
  return product.chains.reduce<string | null>(
    (newest, chain) =>
      newest === null || chain.price_date > newest ? chain.price_date : newest,
    null,
  );
}

export function getMinPrice(product: ProductResponse): number | null {
  if (product.chains.length === 0) return null;

  return Math.min(...product.chains.map((chain) => chain.min_price));
}

export function getMaxPrice(product: ProductResponse): number | null {
  if (product.chains.length === 0) return null;

  return Math.max(...product.chains.map((chain) => chain.max_price));
}

export function getAveragePrice(product: ProductResponse): number | null {
  if (product.chains.length === 0) return null;

  const total = product.chains.reduce((sum, chain) => sum + chain.avg_price, 0);

  return total / product.chains.length;
}

export function getChainAvgPriceRange(
  product: ProductResponse | undefined,
): { min: number; max: number } | null {
  const prices = (product?.chains ?? []).map((chain) => chain.avg_price);

  if (prices.length === 0) return null;

  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getCheapestChainByMinPrice(
  chains: ChainProductResponse[],
): { chain: ChainProductResponse; price: number } | null {
  if (chains.length === 0) return null;

  const cheapest = chains.reduce((lowest, current) =>
    current.min_price < lowest.min_price ? current : lowest,
  );

  return { chain: cheapest, price: cheapest.min_price };
}
