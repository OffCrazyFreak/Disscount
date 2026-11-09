import { z } from "zod";

import type { TimeRangeDto } from "@/lib/api/schemas";
import type {
  IDatedRanges,
  IParsedHours,
} from "@/lib/store-hours/sync/hours-source-types";
import { dayIndex, emptyWeek } from "@/lib/store-hours/sources/hours-text";
import { addDays } from "@/lib/store-hours/zagreb-clock";

// A Java Calendar dump: only the fields we read. Months count from 0.
const calendar = z.object({
  year: z.number(),
  month: z.number(),
  dayOfMonth: z.number(),
  hourOfDay: z.number(),
  minute: z.number(),
});

const times = {
  from1: calendar.nullish(),
  to1: calendar.nullish(),
  from2: calendar.nullish(),
  to2: calendar.nullish(),
};

/** The hours fields of a Spar store; each falls back alone so a pin never fails on hours. */
export const sparHoursFields = {
  shopHours: z
    .array(
      z.object({ openingHours: z.object({ dayType: z.string(), ...times }) }),
    )
    .catch([]),
  specialShopHours: z
    .array(
      z.object({ openingHours: z.object({ dayType: calendar, ...times }) }),
    )
    .catch([]),
  temporarilyClosed: z
    .object({ dateFrom: calendar, dateTo: calendar })
    .nullish()
    .catch(null),
  pageUrl: z.string().nullish(),
};

type Times = { [key in keyof typeof times]?: z.infer<typeof calendar> | null };
type SparHours = z.infer<z.ZodObject<typeof sparHoursFields>>;

// Closures longer than this cannot reach the status function anyway.
const MAX_CLOSED_DAYS = 60;

function clockOf(time: z.infer<typeof calendar>): string {
  return `${String(time.hourOfDay).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

function dateOf(time: z.infer<typeof calendar>): string {
  return `${time.year}-${String(time.month + 1).padStart(2, "0")}-${String(time.dayOfMonth).padStart(2, "0")}`;
}

function rangesOf(day: Times): TimeRangeDto[] {
  const ranges: TimeRangeDto[] = [];

  for (const [from, to] of [
    [day.from1, day.to1],
    [day.from2, day.to2],
  ]) {
    if (from && to && clockOf(from) !== clockOf(to)) {
      ranges.push({ opens: clockOf(from), closes: clockOf(to) });
    }
  }

  return ranges;
}

function closedDays(
  closed: SparHours["temporarilyClosed"],
  today: string,
): IDatedRanges[] {
  if (!closed) return [];

  const days: IDatedRanges[] = [];
  const last = dateOf(closed.dateTo);
  let date = dateOf(closed.dateFrom) < today ? today : dateOf(closed.dateFrom);

  while (date <= last && days.length < MAX_CLOSED_DAYS) {
    days.push({ date, ranges: [] });
    date = addDays(date, 1);
  }

  return days;
}

/** A refit closure wins over both weekly and special hours. */
export function parseSparHours(
  store: SparHours,
  today: string,
): IParsedHours | undefined {
  if (store.shopHours.length === 0) return undefined;

  const weekly = emptyWeek();

  for (const { openingHours } of store.shopHours) {
    const index = dayIndex(openingHours.dayType);

    if (index !== -1) weekly[index] = rangesOf(openingHours);
  }

  const closed = closedDays(store.temporarilyClosed, today);
  const closedDates = new Set(closed.map((day) => day.date));
  const special = store.specialShopHours
    .map(({ openingHours }) => ({
      date: dateOf(openingHours.dayType),
      ranges: rangesOf(openingHours),
    }))
    .filter((day) => !closedDates.has(day.date));

  return { weekly, dated: [...closed, ...special] };
}
