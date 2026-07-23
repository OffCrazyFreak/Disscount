import { ChartDataPoint } from "@/typings/chart-data";
import { calculatePriceChange } from "@/app/products/utils/product-utils";

function sumFinitePrices(point: ChartDataPoint, eans: string[]) {
  const prices = eans
    .map((ean) => point[ean])
    .filter(
      (price): price is number =>
        typeof price === "number" && Number.isFinite(price),
    );

  return { total: prices.reduce((sum, price) => sum + price, 0), prices };
}

export function calculateTotalPriceChange(
  chartData: ChartDataPoint[],
  eans: string[],
) {
  if (chartData.length === 0) return null;

  const historical = sumFinitePrices(chartData[0], eans);
  const current = sumFinitePrices(chartData[chartData.length - 1], eans);

  if (historical.prices.length === 0 || current.prices.length === 0) {
    return null;
  }

  return calculatePriceChange(current.total, historical.total);
}
