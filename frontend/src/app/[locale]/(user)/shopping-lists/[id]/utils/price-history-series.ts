import { ProductResponse } from "@/lib/cijene-api/schemas";
import { buildDateWindow } from "@/utils/date";
import { PRICE_ARCHIVE_START } from "@/constants/price-history";

export function getPriceHistoryDates(daysToShow: number): string[] {
  return buildDateWindow(daysToShow, PRICE_ARCHIVE_START);
}

export function groupPriceHistoriesByEan(
  productsData: (ProductResponse | undefined)[],
  eans: string[],
  datesLength: number,
): Record<string, (ProductResponse | undefined)[]> {
  const result: Record<string, (ProductResponse | undefined)[]> = {};

  eans.forEach((ean, eanIndex) => {
    const startIdx = eanIndex * datesLength;
    const endIdx = startIdx + datesLength;
    // Keep positional (date-aligned) holes; filtering would desync prices from dates.
    result[ean] = productsData.slice(startIdx, endIdx);
  });

  return result;
}

export function getAvailableChains(
  priceHistoriesByEan: Record<string, (ProductResponse | undefined)[]>,
): string[] {
  const chainSet = new Set<string>();

  Object.values(priceHistoriesByEan).forEach((products) => {
    products.forEach((product) => {
      product?.chains?.forEach((chain) => chainSet.add(chain.chain));
    });
  });

  return Array.from(chainSet);
}
