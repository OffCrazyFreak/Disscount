import type { StoreHoursDto, TimeRangeDto } from "@/lib/api/schemas";
import { isoWeekday, SUNDAY } from "@/lib/store-hours/zagreb-clock";

/** The intervals a store keeps on one day, or `null` when nobody knows. */
export type DayHours = { ranges: TimeRangeDto[]; verifiedAt: string } | null;

/**
 * Resolves one day: a dated entry wins (the store's own exception or the
 * chain's Sunday and holiday announcement), then the law, then the weekly
 * template. Shops are closed on public holidays and on every Sunday but the
 * 16 each trader picks (NN 33/2023), so without a dated entry a holiday is
 * closed and a Sunday is unknown, never open from the template.
 */
export function hoursOnDate(
  hours: StoreHoursDto,
  date: string,
  holidays: ReadonlySet<string>,
): DayHours {
  const dated = hours.dated.find((entry) => entry.date === date);

  if (dated) return dated;

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
