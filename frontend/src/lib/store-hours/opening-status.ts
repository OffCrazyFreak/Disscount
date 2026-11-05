import type { StoreHoursDto } from "@/lib/api/schemas";
import { hoursOnDate } from "@/lib/store-hours/hours-on-date";
import { addDays, zagrebClock } from "@/lib/store-hours/zagreb-clock";

/** A wall-clock moment in Zagreb. */
export interface IClockMoment {
  date: string;
  time: string;
}

export type OpeningStatus =
  | {
      state: "open" | "closing-soon";
      closesAt: IClockMoment | null;
      asOf: string;
    }
  | {
      state: "closed" | "opening-soon";
      opensAt: IClockMoment | null;
      asOf: string;
    }
  | { state: "unconfirmed"; asOf: string | null };

const DAY = 24 * 60;

// An hour leaves time to get there and still shop, and is short enough to wait out.
const SOON_MINUTES = 60;

// Far enough to find Monday's opening from a Saturday evening before a holiday.
const LOOKAHEAD_DAYS = 7;

interface ISpan {
  start: number;
  end: number;
  known: boolean;
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

// Minutes from today's midnight, so yesterday's late shift can reach into today.
function spansAround(
  hours: StoreHoursDto,
  today: string,
  holidays: ReadonlySet<string>,
  at: Date,
): ISpan[] {
  const spans: ISpan[] = [];

  for (let offset = -1; offset <= LOOKAHEAD_DAYS; offset++) {
    const day = hoursOnDate(hours, addDays(today, offset), holidays, at);
    const midnight = offset * DAY;

    if (!day) {
      spans.push({ start: midnight, end: midnight + DAY, known: false });
      continue;
    }

    for (const range of day.ranges) {
      const opens = minutesOf(range.opens);
      const closes = minutesOf(range.closes);
      const end = closes <= opens ? closes + DAY : closes;

      spans.push({ start: midnight + opens, end: midnight + end, known: true });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}

function momentAt(today: string, minutes: number): IClockMoment {
  const days = Math.floor(minutes / DAY);

  // A closing on a day boundary ends that day, so it reads "at midnight", not "tomorrow at 0:00".
  if (minutes > 0 && minutes % DAY === 0) {
    return { date: addDays(today, days - 1), time: "24:00" };
  }

  const rest = minutes - days * DAY;
  const time = `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;

  return { date: addDays(today, days), time };
}

// Back-to-back intervals (24:00 then 00:00) are one opening, not two.
function closingOf(open: ISpan[], from: ISpan): number {
  let end = from.end;

  for (const span of open) {
    if (span.start <= end && span.end > end) end = span.end;
  }

  return end;
}

/**
 * Whether a store is open at an instant, and until or from when. The one
 * place that answers it, so the map badge, the list and the "open now"
 * filter never disagree.
 */
export function openingStatusAt(
  hours: StoreHoursDto,
  holidays: ReadonlySet<string>,
  at: Date,
): OpeningStatus {
  const { date: today, minutes: now } = zagrebClock(at);
  const spans = spansAround(hours, today, holidays, at);
  const open = spans.filter((span) => span.known);
  const asOf = hoursOnDate(hours, today, holidays, at)?.verifiedAt ?? null;
  const current = open.find((span) => span.start <= now && now < span.end);

  if (current) {
    const end = closingOf(open, current);
    const aroundTheClock = end >= (LOOKAHEAD_DAYS + 1) * DAY;

    return {
      state: end - now <= SOON_MINUTES ? "closing-soon" : "open",
      closesAt: aroundTheClock ? null : momentAt(today, end),
      asOf: asOf ?? hours.verifiedAt,
    };
  }

  if (asOf === null) return { state: "unconfirmed", asOf: hours.verifiedAt };

  const next = open.find((span) => span.start > now);
  // An unknown day before the next opening may itself be open.
  const unknownFirst = spans.some(
    (span) =>
      !span.known && span.end > now && (!next || span.start < next.start),
  );

  const opensAt = next && !unknownFirst ? next.start : null;

  return {
    state:
      opensAt !== null && opensAt - now <= SOON_MINUTES
        ? "opening-soon"
        : "closed",
    opensAt: opensAt === null ? null : momentAt(today, opensAt),
    asOf,
  };
}
