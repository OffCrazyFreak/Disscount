import type { TimeRangeDto } from "@/lib/api/schemas";
import type {
  IDatedRanges,
  IParsedHours,
} from "@/lib/store-hours/sync/hours-source-types";
import { addDays, isoWeekday, SUNDAY } from "@/lib/store-hours/zagreb-clock";
import { normalizeForSearch } from "@/utils/strings";

export type Weekly = IParsedHours["weekly"];

/** Croatian day words and their abbreviations, folded, Monday first. */
const DAY_WORDS = [
  ["pon", "ponedjeljak"],
  ["uto", "utorak"],
  ["sri", "srijeda"],
  ["cet", "cetvrtak"],
  ["pet", "petak"],
  ["sub", "subota"],
  ["ned", "nedjelja"],
];

const ENGLISH_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// "Zatvoreno", "Ne radi", "NERADNA", "Ne radimo", "Closed".
const CLOSED_TEXT = /^(zatvoreno|ne ?radi\w*|neradn\w*|closed)$/i;

const CLOCK_RANGE =
  /^(\d{1,2})(?:[:.](\d\d))?\s*[-–]\s*(\d{1,2})(?:[:.](\d\d))?$/;

export function fold(text: string): string {
  return normalizeForSearch(text).trim();
}

function clock(hours: string, minutes = "00"): string | null {
  const value = Number(hours);

  if (value > 24 || Number(minutes) > 59) return null;
  if (value === 24 && minutes !== "00") return null;

  return `${String(value).padStart(2, "0")}:${minutes}`;
}

/**
 * Reads "07:00 - 21:00", "07:00-21:00", "7 – 12:30" or "09:00 - 00:00" (closes
 * at midnight). A range with equal ends is a feed's way of saying closed.
 */
export function parseClockRange(text: string): TimeRangeDto | null {
  const match = CLOCK_RANGE.exec(text.trim());

  if (!match) return null;

  const opens = clock(match[1], match[2]);
  const closes = clock(match[3], match[4]);

  if (!opens || !closes || opens === closes) return null;

  return { opens, closes };
}

/** Intervals in one cell ("07:00 - 12:00 / 17:00 - 19:00"), closed words, or null. */
export function parseDayText(text: string): TimeRangeDto[] | null {
  const cleaned = text.replace(/\bsati\b/gi, "").trim();

  if (CLOSED_TEXT.test(cleaned)) return [];

  const ranges = cleaned.split(/\s*[/,]\s*/).map(parseClockRange);

  return ranges.every((range) => range !== null) ? ranges : null;
}

/** Day index for a Croatian or English day word or abbreviation. */
export function dayIndex(word: string): number {
  const folded = fold(word).replace(/\.$/, "");
  const english = ENGLISH_DAYS.indexOf(folded);

  if (english !== -1) return english;

  return DAY_WORDS.findIndex(
    ([short, long]) => folded === short || folded === long,
  );
}

/** Days a label covers: "Pon-Pet", "Pon - Sub", "Subota", "Pon.-sub.". */
export function daysOfLabel(label: string): number[] {
  const [first, last] = label.split(/\s*[-–]\s*/);
  const from = dayIndex(first);
  const to = last === undefined ? from : dayIndex(last);

  if (from === -1 || to === -1 || to < from) return [];

  return Array.from({ length: to - from + 1 }, (_, step) => from + step);
}

export function emptyWeek(): Weekly {
  return Array.from({ length: 7 }, () => null);
}

/** The Sunday a page means by "this Sunday": today when today is one. */
export function comingSunday(today: string): string {
  return addDays(today, (SUNDAY - isoWeekday(today) + 7) % 7);
}

/**
 * A week from "label: hours" pairs ("Pon-Pet", "07:00 - 21:00"). A later
 * pair overrides an earlier one for the same day, as the chains' own pages
 * read; a label or value it cannot read is skipped, leaving that day unknown.
 */
export function weekFromLabelled(pairs: [string, string][]): Weekly {
  const weekly = emptyWeek();

  for (const [label, text] of pairs) {
    const ranges = parseDayText(text);

    if (!ranges) continue;

    for (const day of daysOfLabel(label)) weekly[day] = ranges;
  }

  return weekly;
}

/** Strips tags and entities from a fragment of a store page. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * For a chain that lists every Sunday a store trades, each unlisted Sunday
 * from today up to the last date it lists is a closed one.
 */
export function settleSundays(
  dated: IDatedRanges[],
  today: string,
): IDatedRanges[] {
  const listed = new Set(dated.map((day) => day.date));
  const last = [...listed].sort().at(-1);
  const closed: IDatedRanges[] = [];

  if (!last) return dated;

  for (let date = comingSunday(today); date <= last; date = addDays(date, 7)) {
    if (!listed.has(date)) closed.push({ date, ranges: [] });
  }

  return [...dated, ...closed];
}
