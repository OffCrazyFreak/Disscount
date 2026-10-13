import { formatLocale, TIME_ZONE } from "@/i18n/formatting";
import { parseServerDate } from "@/utils/date";

/** "05.03." for the tile corner: day and month are enough to tell recent cards apart. */
export function formatTileDate(value: string, locale: string): string {
  const date = parseServerDate(value);

  if (Number.isNaN(date.getTime())) return "";

  // 05/03 is a different day to British and American readers, so English spells the month.
  const spelledMonth = locale === "en";

  return new Intl.DateTimeFormat(formatLocale(locale), {
    day: spelledMonth ? "numeric" : "2-digit",
    month: spelledMonth ? "short" : "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}
