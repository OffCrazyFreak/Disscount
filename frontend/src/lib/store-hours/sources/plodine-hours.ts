import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import {
  comingSunday,
  plainText,
  weekFromLabelled,
} from "@/lib/store-hours/sources/hours-text";
import { SUNDAY } from "@/lib/store-hours/zagreb-clock";

/**
 * A store card lists seven "Ponedjeljak : 07:00-21:00" rows. Its Sunday row
 * and `data-open-on-sunday` describe the coming Sunday (the page's filter
 * says "Otvoreno ove nedjelje"), so that row becomes a dated entry.
 */
export function parsePlodineHours(
  card: string,
  today: string,
): IParsedHours | undefined {
  const rows = [
    ...card.matchAll(/<span>([^<]*?)\s*:\s*<\/span>\s*<strong[^>]*>([^<]*)</g),
  ].map((match): [string, string] => [
    plainText(match[1]),
    plainText(match[2]),
  ]);
  const weekly = weekFromLabelled(rows);
  const sunday = weekly[SUNDAY];

  if (rows.length === 0) return undefined;

  return {
    weekly,
    dated: sunday ? [{ date: comingSunday(today), ranges: sunday }] : [],
  };
}

/** The card's own store page, "https://www.plodine.hr/supermarketi/129/…". */
export function plodinePageUrl(card: string): string | undefined {
  return /href="(https:\/\/www\.plodine\.hr\/supermarketi\/\d+\/[\w-]+)"/.exec(
    card,
  )?.[1];
}
