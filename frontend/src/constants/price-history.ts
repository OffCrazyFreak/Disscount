import { PeriodOption } from "@/typings/history-period-options";

// Earliest day the price archive has data for.
export const PRICE_ARCHIVE_START = "2025-05-16";

export const periodOptions: Record<
  PeriodOption,
  { days: number; title: string }
> = {
  "1W": { days: 7, title: "(posljednjih 7 dana)" },
  "1M": { days: 30, title: "(posljednjih 30 dana)" },
  "1Y": { days: 365, title: "(posljednjih 365 dana)" },
  ALL: { days: -1, title: "(od početka)" },
};

// Disabled until the API can return them in one request (see #62 and #45).
export const DISABLED_PERIODS: PeriodOption[] = ["1Y", "ALL"];

// A stored preference could otherwise mount straight into the heavy fetch.
export function getEnabledPeriod(period: PeriodOption): PeriodOption {
  return DISABLED_PERIODS.includes(period) ? "1W" : period;
}
