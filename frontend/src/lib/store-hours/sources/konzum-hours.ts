import { z } from "zod";

import type { TimeRangeDto } from "@/lib/api/schemas";
import type {
  IDatedRanges,
  IParsedHours,
} from "@/lib/store-hours/sync/hours-source-types";
import { dayIndex, emptyWeek } from "@/lib/store-hours/sources/hours-text";
import { addDays, isoWeekday } from "@/lib/store-hours/zagreb-clock";

const daySchema = z.object({
  name: z.string(),
  from_hour: z.string().nullable(),
  to_hour: z.string().nullable(),
});

function rangesOf(day: z.infer<typeof daySchema>): TimeRangeDto[] {
  const opens = day.from_hour?.slice(11, 16);
  const closes = day.to_hour?.slice(11, 16);

  return opens && closes && opens !== closes ? [{ opens, closes }] : [];
}

// A closed day carries no timestamp, so its date comes from its place in the run of consecutive days.
function firstDate(days: z.infer<typeof daySchema>[], today: string) {
  const anchor = days.findIndex((day) => day.from_hour);

  if (anchor !== -1) {
    return addDays(days[anchor].from_hour!.slice(0, 10), -anchor);
  }

  return dayIndex(days[0]?.name ?? "") === isoWeekday(today) ? today : null;
}

/** Konzum publishes only ten dated days; the template takes each weekday's open one, as holidays close. */
export function parseKonzumHours(
  workHours: string,
  today: string,
): IParsedHours | undefined {
  let raw: unknown;

  try {
    raw = JSON.parse(workHours);
  } catch {
    return undefined;
  }

  const days = z.array(daySchema).safeParse(raw);
  const start = days.success ? firstDate(days.data, today) : null;

  if (!days.success || !start) return undefined;

  const weekly = emptyWeek();
  const dated: IDatedRanges[] = days.data.map((day, index) => ({
    date: addDays(start, index),
    ranges: rangesOf(day),
  }));

  for (const day of dated) {
    const weekday = isoWeekday(day.date);

    if (!weekly[weekday]?.length) weekly[weekday] = day.ranges;
  }

  return { weekly, dated };
}
