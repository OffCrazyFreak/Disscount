import { ChartConfig } from "@/components/ui/chart";
import { ChartDataPoint } from "@/typings/chart-data";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { ShoppingListItemDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import { buildDateWindow } from "@/utils/date";
import { PRICE_ARCHIVE_START } from "@/constants/price-history";
import { calculatePriceChange } from "@/app/products/utils/product-utils";

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

      const entry = dateMap.get(date)!;
      const chartPoint = entry.data;

      if (product?.chains && product.chains.length > 0) {
        const prices: number[] = [];

        product.chains.forEach((chainData) => {
          if (selectedChains.includes(chainData.chain)) {
            const avgPrice = parseFloat(chainData.avg_price);
            if (Number.isFinite(avgPrice)) {
              prices.push(avgPrice);
            }
          }
        });

        if (prices.length > 0) {
          const averagePrice =
            prices.reduce((sum, p) => sum + p, 0) / prices.length;
          chartPoint[ean] = parseFloat(averagePrice.toFixed(2));
        }
      }
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

const AXIS_DECIMALS = 2;
const AXIS_MIN_STEP = 10 ** -AXIS_DECIMALS;

// Round a target step up to a "nice" 1/2/5 x 10^n value, aiming for ~6 ticks.
function niceAxisStep(range: number): number {
  if (range <= 0) return 1;
  const target = range / 6;
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  const normalized = target / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return Math.max(nice * magnitude, AXIS_MIN_STEP);
}

export function calculateYAxisTicks(chartData: ChartDataPoint[]): number[] {
  const padding = 0.05;

  if (chartData.length === 0) return [];

  const allPrices = chartData.flatMap((d) =>
    Object.entries(d)
      .filter(([k]) => k !== "date")
      .map(([_, v]) => (typeof v === "number" ? v : 0)),
  );

  if (allPrices.length === 0) return [];

  const paddedMin = Math.min(...allPrices) * (1 - padding);
  const paddedMax = Math.max(...allPrices) * (1 + padding);

  const ticks = [];
  const step = niceAxisStep(paddedMax - paddedMin);
  const start = Math.floor(paddedMin / step) * step;
  const end = Math.ceil(paddedMax / step) * step;

  for (let i = start; i <= end; i += step) {
    ticks.push(parseFloat(i.toFixed(AXIS_DECIMALS)));
  }

  return ticks;
}

export function calculateTotalPriceChange(
  chartData: ChartDataPoint[],
  eans: string[],
) {
  if (chartData.length === 0) {
    return null;
  }

  const historicalData = chartData[0];
  const currentData = chartData[chartData.length - 1];

  let historicalTotal = 0;
  let currentTotal = 0;
  let historicalCount = 0;
  let currentCount = 0;

  eans.forEach((ean) => {
    const historicalPrice = historicalData[ean];
    const currentPrice = currentData[ean];

    if (
      typeof historicalPrice === "number" &&
      Number.isFinite(historicalPrice)
    ) {
      historicalTotal += historicalPrice;
      historicalCount++;
    }

    if (typeof currentPrice === "number" && Number.isFinite(currentPrice)) {
      currentTotal += currentPrice;
      currentCount++;
    }
  });

  if (historicalCount === 0 || currentCount === 0) {
    return null;
  }

  return calculatePriceChange(currentTotal, historicalTotal);
}
