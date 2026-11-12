import { z } from "zod";

import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import { parseClockRange } from "@/lib/store-hours/sources/hours-text";

const schedule = z.object({ start: z.string(), end: z.string() });

export const tommyHoursSchema = z
  .object({
    workweekSchedule: schedule,
    saturdaySchedule: schedule,
    sundaySchedule: schedule,
  })
  .nullish()
  .catch(null);

function rangesOf({ start, end }: z.infer<typeof schedule>) {
  const range = parseClockRange(`${start}-${end}`);

  // Empty strings mark a closed day.
  return range ? [range] : [];
}

/** Monday to Friday as one block, then Saturday and Sunday. */
export function parseTommyHours(
  hours: z.infer<typeof tommyHoursSchema>,
): IParsedHours | undefined {
  if (!hours) return undefined;

  const workday = rangesOf(hours.workweekSchedule);

  return {
    weekly: [
      workday,
      workday,
      workday,
      workday,
      workday,
      rangesOf(hours.saturdaySchedule),
      rangesOf(hours.sundaySchedule),
    ],
    dated: [],
  };
}
