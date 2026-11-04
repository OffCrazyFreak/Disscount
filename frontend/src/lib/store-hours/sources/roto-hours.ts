import { z } from "zod";

import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import {
  emptyWeek,
  parseDayText,
  settleSundays,
} from "@/lib/store-hours/sources/hours-text";
import { SUNDAY } from "@/lib/store-hours/zagreb-clock";

export const rotoHoursFields = {
  radno: z
    .array(z.object({ dayOfWeek: z.number(), workingTime: z.string() }))
    .catch([]),
  nedjelje: z.array(z.string()).catch([]),
};

type RotoHours = z.infer<z.ZodObject<typeof rotoHoursFields>>;

// "8.11.2026." (day, month, year; one entry drops the last dot).
function isoOf(text: string): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/.exec(text.trim());

  return match
    ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
    : null;
}

/** `radno` numbers days from Sunday (JavaScript's getDay); "Ne radi" is closed; retail shops list working Sundays in `nedjelje`. */
export function parseRotoHours(
  site: RotoHours,
  today: string,
): IParsedHours | undefined {
  if (site.radno.length === 0) return undefined;

  const weekly = emptyWeek();

  for (const { dayOfWeek, workingTime } of site.radno) {
    if (dayOfWeek >= 0 && dayOfWeek <= 6) {
      weekly[(dayOfWeek + 6) % 7] = parseDayText(workingTime);
    }
  }

  const sundayHours = weekly[SUNDAY] ?? [];
  const listed = site.nedjelje
    .map(isoOf)
    .filter((date) => date !== null && date >= today)
    .map((date) => ({ date: date as string, ranges: sundayHours }));

  // The list is the store's whole plan, so the Sundays between are closed.
  return {
    weekly,
    dated: sundayHours.length ? settleSundays(listed, today) : [],
  };
}
