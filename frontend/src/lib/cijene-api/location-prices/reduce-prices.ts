import type { PriceRange, StorePrice } from "@/lib/cijene-api/schemas";
import { parsePrice } from "@/utils/product-price-utils";

export type CityPrices = Map<string, PriceRange>;

/** Upstream matches `city` as a substring, so "Sesvete" also returns "Sesvete - Kraljevec" stores; only the exact name counts here. */
export function reduceByCity(
  rows: StorePrice[],
  onlyCities?: ReadonlySet<string>,
): Map<string, CityPrices> {
  const byCity = new Map<string, CityPrices>(
    [...(onlyCities ?? [])].map((city) => [city, new Map()]),
  );

  for (const row of rows) {
    const city = row.store.city?.trim();
    if (!city || (onlyCities && !onlyCities.has(city))) continue;

    const price =
      parsePrice(row.special_price ?? "") ??
      parsePrice(row.regular_price ?? "");
    if (price === null) continue;

    const prices = byCity.get(city) ?? new Map<string, PriceRange>();
    const range = prices.get(row.ean);

    prices.set(
      row.ean,
      range
        ? { min: Math.min(range.min, price), max: Math.max(range.max, price) }
        : { min: price, max: price },
    );
    byCity.set(city, prices);
  }

  return byCity;
}

export function mergeCityPrices(
  cities: Iterable<CityPrices>,
): Record<string, PriceRange> {
  const merged: Record<string, PriceRange> = {};

  for (const prices of cities) {
    for (const [ean, range] of prices) {
      const current = merged[ean];

      merged[ean] = current
        ? {
            min: Math.min(current.min, range.min),
            max: Math.max(current.max, range.max),
          }
        : range;
    }
  }

  return merged;
}
