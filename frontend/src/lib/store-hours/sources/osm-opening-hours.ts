import type { TimeRangeDto } from "@/lib/api/schemas";

type Weekly = (TimeRangeDto[] | null)[];

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const TIME_RANGE = /^([01]\d|2[0-4]):([0-5]\d)-([01]\d|2[0-4]):([0-5]\d)$/;

function parseDays(selector: string): number[] | null {
  const days: number[] = [];

  for (const part of selector.split(",")) {
    const [first, last = first] = part.split("-");
    const from = DAYS.indexOf(first);
    const to = DAYS.indexOf(last);

    if (from === -1 || to === -1) return null;

    // "Su-Mo" wraps around the week.
    const length = ((to - from + 7) % 7) + 1;

    for (let step = 0; step < length; step++) days.push((from + step) % 7);
  }

  return days;
}

function parseTimes(selector: string): TimeRangeDto[] | null {
  if (selector === "off" || selector === "closed") return [];

  const ranges: TimeRangeDto[] = [];

  for (const part of selector.split(",")) {
    const match = TIME_RANGE.exec(part);

    if (!match) return null;

    ranges.push({
      opens: `${match[1]}:${match[2]}`,
      closes: `${match[3]}:${match[4]}`,
    });
  }

  return ranges;
}

type Rule = { days: number[]; ranges: TimeRangeDto[] };

// One ";" rule: "Mo-Sa 07:00-21:00", "Su off", a bare "07:00-22:00" (every
// day), "Su,PH off" (the holiday part is the law's to decide).
function parseRule(rule: string): Rule | null {
  const words = rule.replace(/(^|,)PH(?=,|\s)|,PH\b/g, "").split(/\s+/);
  const [selector, times, ...rest] =
    words.length === 1 ? ["Mo-Su", ...words] : words;
  const days = parseDays(selector);
  const ranges = times === undefined ? null : parseTimes(times);

  return days && ranges && rest.length === 0 ? { days, ranges } : null;
}

/**
 * Reads the plain weekly subset of OSM `opening_hours` ("Mo-Sa 07:00-21:00;
 * Su off; PH off"). Anything richer (months, week numbers, comments, open
 * ends) returns null rather than a guess, since one evaluator decides open
 * or closed. Public holiday rules are skipped: the law closes shops then.
 * Days a value leaves out are closed, as the OSM specification says.
 */
export function parseOsmOpeningHours(value: string): Weekly | null {
  const trimmed = value.trim();

  if (trimmed === "24/7") {
    return Array.from({ length: 7 }, () => [
      { opens: "00:00", closes: "24:00" },
    ]);
  }

  const rules = trimmed
    .replace(/\s*,\s*/g, ",")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !/^PH\b/.test(part))
    .map(parseRule);

  if (rules.length === 0 || rules.includes(null)) return null;

  const weekly: Weekly = Array.from({ length: 7 }, () => []);

  // A later rule replaces an earlier one for the same days.
  for (const rule of rules as Rule[]) {
    for (const day of rule.days) weekly[day] = rule.ranges;
  }

  return weekly;
}
