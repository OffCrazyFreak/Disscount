import { TIME_ZONE } from "@/i18n/formatting";

// Every store is in Croatia, so hours are read on Zagreb's wall clock whatever
// zone the device or the server runs in.
const zagrebParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The Zagreb calendar date and minutes since its midnight at an instant. */
export function zagrebClock(at: Date): { date: string; minutes: number } {
  const part = Object.fromEntries(
    zagrebParts.formatToParts(at).map(({ type, value }) => [type, value]),
  );

  return {
    date: `${part.year}-${part.month}-${part.day}`,
    minutes: Number(part.hour) * 60 + Number(part.minute),
  };
}

/** Calendar arithmetic on ISO dates, free of time zones and DST. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** Whole days from one ISO date to another; `Date.parse` reads both as UTC. */
export function daysBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000);
}

/** 0 for Monday through 6 for Sunday, as ISO 8601 counts. */
export function isoWeekday(date: string): number {
  const [year, month, day] = date.split("-").map(Number);

  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export const SUNDAY = 6;
