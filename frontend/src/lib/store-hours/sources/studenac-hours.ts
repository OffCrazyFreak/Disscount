import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import {
  dayIndex,
  parseDayText,
  plainText,
} from "@/lib/store-hours/sources/hours-text";
import { addDays } from "@/lib/store-hours/zagreb-clock";

/**
 * A store page's "Radno vrijeme <small>02.11 - 08.11.2026.</small>" table is
 * this week's real schedule, Monday to Sunday, so each row is a dated entry
 * as well as the template; split shifts come as two ranges split by `<br>`.
 */
export function parseStudenacPage(html: string): IParsedHours | undefined {
  const start = html.indexOf('class="marketsingle__workhours"');
  const block = start === -1 ? null : html.slice(start, start + 4_000);
  const window =
    block &&
    /<small>(\d\d)\.(\d\d)\s*-\s*\d\d\.\d\d\.(\d{4})\.?<\/small>/.exec(block);

  if (!block || !window) return undefined;

  const monday = `${window[3]}-${window[2]}-${window[1]}`;
  const weekly: IParsedHours["weekly"] = Array.from({ length: 7 }, () => null);

  for (const row of block.matchAll(
    /<li>\s*([^:<]+):\s*<strong[^>]*>([\s\S]*?)<\/strong>/g,
  )) {
    const day = dayIndex(row[1]);
    const ranges = parseDayText(
      plainText(row[2].replace(/<br\s*\/?>/g, " / ")),
    );

    if (day !== -1) weekly[day] = ranges;
  }

  // A Monday that is not one would shift every date.
  if (new Date(`${monday}T12:00:00Z`).getUTCDay() !== 1) return undefined;

  return {
    weekly,
    dated: weekly.flatMap((ranges, day) =>
      ranges ? [{ date: addDays(monday, day), ranges }] : [],
    ),
  };
}

export interface IStudenacCard {
  code: string;
  address: string;
  city?: string;
  pageUrl: string;
}

/** The list page's cards: store number, "street, town" and the store page link. */
export function parseStudenacList(html: string): IStudenacCard[] {
  return html
    .split('<li class="marketlisting__item"')
    .slice(1)
    .flatMap((card) => {
      const code = /data-store-id="(\d+)"/.exec(card)?.[1];
      const title = /class="card__title">([^<]*)</.exec(card)?.[1];
      const pageUrl =
        /href="(https:\/\/www\.studenac\.hr\/trgovine\/\d+\/[\w-]+)"/.exec(
          card,
        )?.[1];

      if (!code || !title || !pageUrl) return [];

      const text = plainText(title);
      const cut = text.lastIndexOf(",");

      return [
        {
          code,
          address: cut === -1 ? text : text.slice(0, cut).trim(),
          city: cut === -1 ? undefined : text.slice(cut + 1).trim(),
          pageUrl,
        },
      ];
    });
}
