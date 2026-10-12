import { ChartConfig } from "@/components/ui/chart";
import { ChartDataPoint } from "@/typings/chart-data";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { ShoppingListItemDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";

export function buildChartData(
  priceHistoriesByEan: Record<string, (ProductResponse | undefined)[]>,
  eans: string[],
  dates: string[],
  selectedChains: string[],
): ChartDataPoint[] {
  if (eans.length === 0 || dates.length === 0) {
    return [];
  }

  const dateMap = new Map<string, { isoDate: string; data: ChartDataPoint }>();

  eans.forEach((ean) => {
    const products = priceHistoriesByEan[ean] || [];

    products.forEach((product, dateIndex) => {
      const date = dates[dateIndex];
      if (!date) return;

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          isoDate: date,
          data: { date: formatDate(date) },
        });
      }

      const prices = (product?.chains ?? [])
        .filter((chain) => selectedChains.includes(chain.chain))
        .map((chain) => parseFloat(chain.avg_price))
        .filter((price) => Number.isFinite(price));

      if (prices.length === 0) return;

      const averagePrice =
        prices.reduce((sum, price) => sum + price, 0) / prices.length;
      dateMap.get(date)!.data[ean] = parseFloat(averagePrice.toFixed(2));
    });
  });

  return Array.from(dateMap.values())
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
    .map((entry) => entry.data);
}

export function buildChartConfig(
  items: ShoppingListItemDto[] | undefined,
): ChartConfig {
  const cfg: ChartConfig = {};

  items?.forEach((item) => {
    const label = item.brand ? `${item.brand} ${item.name}` : item.name;
    cfg[item.ean] = { label };
  });

  return cfg;
}
