import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import {
  dayIndex,
  emptyWeek,
  parseClockRange,
} from "@/lib/store-hours/sources/hours-text";

function rangesOf(opens: string, closes: string) {
  const range = parseClockRange(`${opens}-${closes}`);

  // "00:00|00:00" is how the feed writes a closed day.
  return range ? [range] : [];
}

/** `sod` always holds the coming Sunday and the holidays ahead. */
export function parseKauflandHours(wod: string[], sod: string[]): IParsedHours {
  const weekly = emptyWeek();

  for (const entry of wod) {
    const [day, opens, closes] = entry.split("|");
    const index = dayIndex(day);

    if (index !== -1 && opens && closes)
      weekly[index] = rangesOf(opens, closes);
  }

  const dated = sod.flatMap((entry) => {
    const [date, opens, closes] = entry.split("|");

    return /^\d{4}-\d\d-\d\d$/.test(date) && opens && closes
      ? [{ date, ranges: rangesOf(opens, closes) }]
      : [];
  });

  return { weekly, dated };
}
