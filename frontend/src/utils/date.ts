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
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

// Human-friendly relative time, e.g. "prije 2 sata". Accepts a Date or an
// epoch-millis timestamp (such as React Query's `dataUpdatedAt`).
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
