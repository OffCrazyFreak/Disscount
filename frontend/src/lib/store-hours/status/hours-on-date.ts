import type { StoreHoursDto, TimeRangeDto } from "@/lib/api/schemas";
import { isoWeekday, SUNDAY } from "@/lib/store-hours/zagreb-clock";

/** The intervals a store keeps on one day, or `null` when nobody knows. */
export type DayHours = { ranges: TimeRangeDto[]; verifiedAt: string } | null;

// Two weekly refreshes missed: the data may describe last month's hours.
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

function isFresh(verifiedAt: string, at: Date): boolean {
  return at.getTime() - Date.parse(verifiedAt) <= STALE_AFTER_MS;
}

/** Dated entry, then law, then template: shops close on all but 16 Sundays (NN 33/2023), never open by template. */
export function hoursOnDate(
  hours: StoreHoursDto,
  date: string,
  holidays: ReadonlySet<string>,
  at: Date,
): DayHours {
  const dated = hours.dated.find((entry) => entry.date === date);

  if (dated && isFresh(dated.verifiedAt, at)) return dated;
  if (!isFresh(hours.verifiedAt, at)) return null;

  // Exempt stores (stations, ports) may open on holidays, and no source says which, so those stay unknown.
  const exempt = hours.sundays === "weekly";

  if (holidays.has(date)) {
    return exempt ? null : { ranges: [], verifiedAt: hours.verifiedAt };
  }

  const weekday = isoWeekday(date);

  if (weekday === SUNDAY && !exempt) return null;

  const ranges = hours.weekly[weekday];

  return ranges ? { ranges, verifiedAt: hours.verifiedAt } : null;
}
