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
