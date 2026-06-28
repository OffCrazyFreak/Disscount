import { PeriodOption } from "@/typings/history-period-options";

export const periodOptions: Record<
  PeriodOption,
  { days: number; title: string }
> = {
  "1W": { days: 7, title: "(posljednjih 7 dana)" },
  "1M": { days: 30, title: "(posljednjih 30 dana)" },
  "1Y": { days: 365, title: "(posljednjih 365 dana)" },
  ALL: { days: -1, title: "(od početka)" },
};

// Periods temporarily disabled until the API can return them in one request
// (fetching a full year / all history day-by-day is too heavy).
export const DISABLED_PERIODS: PeriodOption[] = ["1Y", "ALL"];

// Coerce a (possibly persisted) period to an enabled one. A user whose stored
// preference is a now-disabled period (e.g. "1Y"/"ALL" still in localStorage)
// would otherwise mount straight into the heavy fetch the disabling prevents.
export function getEnabledPeriod(period: PeriodOption): PeriodOption {
  return DISABLED_PERIODS.includes(period) ? "1W" : period;
}
