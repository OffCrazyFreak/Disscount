import type { StoreHoursDto, TimeRangeDto } from "@/lib/api/schemas";
import { isoWeekday, SUNDAY } from "@/lib/store-hours/zagreb-clock";

/** The intervals a store keeps on one day, or `null` when nobody knows. */
export type DayHours = { ranges: TimeRangeDto[]; verifiedAt: string } | null;

// Two weekly refreshes missed: the data may describe last month's hours.
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

function isFresh(verifiedAt: string, at: Date): boolean {
  return at.getTime() - Date.parse(verifiedAt) <= STALE_AFTER_MS;
}

/**
 * Resolves one day as known at instant `at`: a dated entry wins (the store's own exception or the
 * chain's Sunday and holiday announcement), then the law, then the weekly
 * template. Shops are closed on public holidays and on every Sunday but the
 * 16 each trader picks (NN 33/2023), so without a dated entry a holiday is
 * closed and a Sunday is unknown, never open from the template. Each layer
 * counts only while fresh: a new Sunday announcement still counts when the
 * template has gone stale, and an old one never confirms a day.
 */
export function hoursOnDate(
  hours: StoreHoursDto,
  date: string,
  holidays: ReadonlySet<string>,
  at: Date,
): DayHours {
  const dated = hours.dated.find((entry) => entry.date === date);

  if (dated && isFresh(dated.verifiedAt, at)) return dated;
  if (!isFresh(hours.verifiedAt, at)) return null;

  // Exempt stores (stations, ports) may open on holidays, and none of our
  // sources says which holidays, so those stay unknown.
  const exempt = hours.sundays === "weekly";

  if (holidays.has(date)) {
    return exempt ? null : { ranges: [], verifiedAt: hours.verifiedAt };
  }

  const weekday = isoWeekday(date);

  if (weekday === SUNDAY && !exempt) return null;

  const ranges = hours.weekly[weekday];

  return ranges ? { ranges, verifiedAt: hours.verifiedAt } : null;
}
