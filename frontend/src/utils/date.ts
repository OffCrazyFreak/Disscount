import { formatLocale } from "@/i18n/formatting";
import {
  addDays,
  daysBetween,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * YYYY-MM-DD strings ending today in Zagreb, chronological, never reaching earlier
 * than `earliest`. Pass -1 for every day since `earliest`. Price dates are Croatian
 * calendar days, so the device's own zone must not pick the last day. A caller that
 * stays mounted across Zagreb midnight passes `today` from its own render, so the
 * window is rebuilt for the new day instead of reusing a cached one.
 */
export function buildDateWindow(
  daysToShow: number,
  earliest: string,
  today: string = zagrebClock(new Date()).date,
): string[] {
  const availableDays = Math.max(0, daysBetween(earliest, today) + 1);
  const cappedDays =
    daysToShow === -1 ? availableDays : Math.min(daysToShow, availableDays);

  return Array.from({ length: cappedDays }, (_, index) =>
    addDays(today, index - cappedDays + 1),
  );
}

// A date and time carrying neither "Z" nor a numeric offset.
const ZONELESS_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;

/**
 * Parses a timestamp the way the backend meant it.
 *
 * Spring serialises LocalDateTime columns without a zone, and the backend stamps them
 * in UTC, but JS reads a zone-less date and time as *local*. Left alone, every server
 * timestamp renders shifted by the reader's offset, which in Croatia means an hour or
 * two. Date-only strings and anything already carrying an offset pass through, since
 * the spec already reads those as UTC and as written respectively.
 */
export function parseServerDate(value: string | number | Date): Date {
  if (typeof value !== "string") return new Date(value);

  return new Date(ZONELESS_DATE_TIME.test(value) ? `${value}Z` : value);
}

const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeTimeFormatter(locale: string) {
  let formatter = relativeTimeFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(formatLocale(locale), {
      numeric: "auto",
    });
    relativeTimeFormatters.set(locale, formatter);
  }

  return formatter;
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
];

// Accepts a Date or epoch millis, such as React Query's `dataUpdatedAt`.
export function formatRelativeTime(
  date: Date | number,
  locale: string,
): string {
  const timestamp = typeof date === "number" ? date : date.getTime();
  let duration = (timestamp - Date.now()) / 1000; // seconds; negative = past

  const formatter = getRelativeTimeFormatter(locale);

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), "years");
}
