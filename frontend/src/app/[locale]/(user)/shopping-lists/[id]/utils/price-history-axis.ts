import { ChartDataPoint } from "@/typings/chart-data";

const AXIS_DECIMALS = 2;
const AXIS_MIN_STEP = 10 ** -AXIS_DECIMALS;
const AXIS_PADDING = 0.05;
const TARGET_TICKS = 6;

// Round a target step up to a "nice" 1/2/5 x 10^n value.
function niceAxisStep(range: number): number {
  if (range <= 0) return 1;

  const target = range / TARGET_TICKS;
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  const normalized = target / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return Math.max(nice * magnitude, AXIS_MIN_STEP);
}

export function calculateYAxisTicks(chartData: ChartDataPoint[]): number[] {
  if (chartData.length === 0) return [];

  const allPrices = chartData.flatMap((point) =>
    Object.entries(point)
      .filter(([key]) => key !== "date")
      .map(([, value]) => (typeof value === "number" ? value : 0)),
  );

  if (allPrices.length === 0) return [];

  const paddedMin = Math.min(...allPrices) * (1 - AXIS_PADDING);
  const paddedMax = Math.max(...allPrices) * (1 + AXIS_PADDING);

  const step = niceAxisStep(paddedMax - paddedMin);
  const start = Math.floor(paddedMin / step) * step;
  const end = Math.ceil(paddedMax / step) * step;

  const ticks: number[] = [];
  for (let tick = start; tick <= end; tick += step) {
    ticks.push(parseFloat(tick.toFixed(AXIS_DECIMALS)));
  }

  return ticks;
}
