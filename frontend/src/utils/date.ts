export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Format as YYYY-MM-DD in local time; toISOString would shift a day near midnight.
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fromLocalDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/**
 * Local YYYY-MM-DD strings ending today, chronological, never reaching earlier
 * than `earliest`. Pass -1 for every day since `earliest`.
 */
export function buildDateWindow(
  daysToShow: number,
  earliest: string,
): string[] {
  const today = new Date();
  const availableDays = Math.max(
    0,
    Math.floor(
      (today.getTime() - fromLocalDateString(earliest).getTime()) /
        MILLISECONDS_PER_DAY,
    ) + 1,
  );
  const cappedDays =
    daysToShow === -1 ? availableDays : Math.min(daysToShow, availableDays);

  const dates: string[] = [];

  for (let i = cappedDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(toLocalDateString(date));
  }

  return dates;
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
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
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
export function formatRelativeTime(date: Date | number, locale = "hr"): string {
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
