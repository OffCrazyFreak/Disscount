import type {
  IDatedRanges,
  IParsedHours,
} from "@/lib/store-hours/sync/hours-source-types";
import {
  parseDayText,
  plainText,
  weekFromLabelled,
} from "@/lib/store-hours/sources/hours-text";
import { labelledLines } from "@/lib/store-hours/sources/labelled-lines";

/** The lines after "RADNO VRIJEME" in a map place's HTML. */
export function parseTrgocentarWeek(address: string): IParsedHours | undefined {
  const hours = address.split(/RADNO VRIJEME/i)[1];
  const lines = hours ? labelledLines(hours) : [];

  return lines.length
    ? { weekly: weekFromLabelled(lines), dated: [] }
    : undefined;
}

export interface ITrgocentarSundays {
  /** "P060", as cijene-api writes the table's "P-060". */
  code: string;
  address: string;
  dated: IDatedRanges[];
}

function cellsOf(row: string): string[] {
  return [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) =>
    plainText(match[1]),
  );
}

function isoOf(text: string): string | null {
  const match = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(text);

  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

/**
 * The "Radne nedjelje" sheet: one column per Sunday of the month, a "1"
 * where the shop trades, at the hours in the third column ("7 – 12"). Every
 * Sunday the sheet covers is settled, open or closed; past ones are dropped.
 */
export function parseTrgocentarSundays(
  html: string,
  today: string,
): ITrgocentarSundays[] {
  const rows = html
    .split(/<tr[^>]*>/)
    .slice(1)
    .map(cellsOf);
  const header = rows.find((cells) => cells.some((cell) => isoOf(cell)));

  if (!header) return [];

  const dates = header.map(isoOf);

  return rows.flatMap((cells) => {
    const code = /^P-(\d+)$/.exec(cells[0] ?? "")?.[1];
    const hours = parseDayText(cells[2] ?? "");

    if (!code || !hours) return [];

    const dated = dates.flatMap((date, column) =>
      date && date >= today
        ? [{ date, ranges: cells[column] === "1" ? hours : [] }]
        : [],
    );

    return [{ code: `P${code.padStart(3, "0")}`, address: cells[1], dated }];
  });
}
