import { z } from "zod";

import type { TimeRangeDto } from "@/lib/api/schemas";
import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import { emptyWeek, parseDayText } from "@/lib/store-hours/sources/hours-text";

const KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const openHoursSchema = z.record(
  z.string(),
  z.union([z.array(z.string()), z.string()]),
);

function rangesOf(value: string[] | string | undefined): TimeRangeDto[] | null {
  if (value === "0") return [];
  if (!Array.isArray(value)) return null;

  const ranges = value.map(parseDayText);

  return ranges.every((day) => day !== null) ? ranges.flat() : null;
}

/** "0" is closed; Sunday hours apply on working Sundays only, as the default rule assumes. */
export function parseRibolaHours(openHours: string): IParsedHours | undefined {
  let raw: unknown;

  try {
    raw = JSON.parse(openHours);
  } catch {
    return undefined;
  }

  const parsed = openHoursSchema.safeParse(raw);

  if (!parsed.success) return undefined;

  const weekly = emptyWeek();

  KEYS.forEach((key, index) => {
    weekly[index] = rangesOf(parsed.data[key]);
  });

  return { weekly, dated: [] };
}
