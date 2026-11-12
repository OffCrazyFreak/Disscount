import type { TimeRangeDto } from "@/lib/api/schemas";
import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import {
  dayIndex,
  emptyWeek,
  fold,
  plainText,
} from "@/lib/store-hours/sources/hours-text";

/** Several `<time>` pairs mean a split shift. */
export function parseStanicHours(table: string): IParsedHours | undefined {
  const weekly = emptyWeek();
  let rows = 0;

  for (const row of table.split(/<tr[^>]*>/).slice(1)) {
    const [dayCell, hoursCell = ""] = row.split(/<\/td>/);
    const day = dayIndex(plainText(dayCell));

    if (day === -1) continue;

    const times = [...hoursCell.matchAll(/datetime="(\d\d:\d\d)"/g)].map(
      (match) => match[1],
    );
    const ranges: TimeRangeDto[] = [];

    for (let index = 0; index + 1 < times.length; index += 2) {
      if (times[index] !== times[index + 1]) {
        ranges.push({ opens: times[index], closes: times[index + 1] });
      }
    }

    rows++;
    weekly[day] =
      ranges.length || fold(plainText(hoursCell)) === "closed" ? ranges : null;
  }

  return rows ? { weekly, dated: [] } : undefined;
}
