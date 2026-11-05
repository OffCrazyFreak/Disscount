import { PeriodOption } from "@/typings/history-period-options";

// Earliest day the price archive has data for.
export const PRICE_ARCHIVE_START = "2025-05-16";

export const periodOptions: Record<
  PeriodOption,
  { days: number; titleKey: string }
> = {
  "1W": { days: 7, titleKey: "priceHistory.period.week" },
  "1M": { days: 30, titleKey: "priceHistory.period.month" },
  "1Y": { days: 365, titleKey: "priceHistory.period.year" },
  ALL: { days: -1, titleKey: "priceHistory.period.all" },
};

// Disabled until the API can return them in one request (see #62 and #45).
export const DISABLED_PERIODS: PeriodOption[] = ["1Y", "ALL"];

// A stored preference could otherwise mount straight into the heavy fetch.
export function getEnabledPeriod(period: PeriodOption): PeriodOption {
  return DISABLED_PERIODS.includes(period) ? "1W" : period;
}
