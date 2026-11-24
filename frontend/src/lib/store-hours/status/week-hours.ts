import type { StoreHoursDto, TimeRangeDto } from "@/lib/api/schemas";
import { hoursOnDate } from "@/lib/store-hours/status/hours-on-date";
import {
  addDays,
  isoWeekday,
  SUNDAY,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

export interface IWeekDay {
  date: string;
  /** 0 for Monday through 6 for Sunday. */
  weekday: number;
  isToday: boolean;
  /** Null when nobody knows; empty when the store is closed. */
  ranges: TimeRangeDto[] | null;
  isHoliday: boolean;
  /** A dated entry that differs from the store's usual hours for that weekday. */
  isException: boolean;
  /** An unknown Sunday at a store the Sunday trading law covers. */
  isRestrictedSunday: boolean;
}

function sameRanges(a: TimeRangeDto[] | null, b: TimeRangeDto[] | null) {
  if (a === null || b === null) return a === b;

  return (
    a.length === b.length &&
    a.every(
      (range, i) => range.opens === b[i].opens && range.closes === b[i].closes,
    )
  );
}

/** The next days from today, so every row has the holiday and dated data the badge uses. */
export function weekHoursOf(
  hours: StoreHoursDto,
  holidays: ReadonlySet<string>,
  at: Date,
  days = 7,
): IWeekDay[] {
  const { date: today } = zagrebClock(at);

  return Array.from({ length: days }, (_, offset) => {
    const date = addDays(today, offset);
    const weekday = isoWeekday(date);
    const day = hoursOnDate(hours, date, holidays, at);
    const dated = hours.dated.find((entry) => entry.date === date);
    const isHoliday = holidays.has(date);

    return {
      date,
      weekday,
      isToday: offset === 0,
      ranges: day?.ranges ?? null,
      isHoliday,
      // A holiday the store opens on anyway is special hours too.
      isException:
        dated !== undefined &&
        day === dated &&
        (isHoliday
          ? day.ranges.length > 0
          : !sameRanges(day.ranges, hours.weekly[weekday] ?? null)),
      isRestrictedSunday:
        day === null && weekday === SUNDAY && hours.sundays !== "weekly",
    };
  });
}
