import { parseServerDate } from "@/utils/date";

/** "05.03." for the tile corner: day and month are enough to tell recent cards apart. */
export function formatTileDate(value: string): string {
  const date = parseServerDate(value);

  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}.${month}.`;
}
