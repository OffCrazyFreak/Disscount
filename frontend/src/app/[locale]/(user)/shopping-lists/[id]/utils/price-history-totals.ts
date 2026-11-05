import { ChartDataPoint } from "@/typings/chart-data";
import { calculatePriceChange } from "@/app/[locale]/products/utils/product-utils";

function finitePrice(point: ChartDataPoint, ean: string): number | null {
  const price = point[ean];
  return typeof price === "number" && Number.isFinite(price) ? price : null;
}

export function calculateTotalPriceChange(
  chartData: ChartDataPoint[],
  eans: string[],
) {
  if (chartData.length === 0) return null;

  const first = chartData[0];
  const last = chartData[chartData.length - 1];

  // Only products priced on both dates count; one priced on just one side would show
  // up as a price change that no price actually made.
  const comparable = eans.filter(
    (ean) =>
      finitePrice(first, ean) !== null && finitePrice(last, ean) !== null,
  );
  if (comparable.length === 0) return null;

  const sum = (point: ChartDataPoint) =>
    comparable.reduce(
      (total, ean) => total + (finitePrice(point, ean) ?? 0),
      0,
    );

  return calculatePriceChange(sum(last), sum(first));
}
