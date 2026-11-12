import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import { weekFromLabelled } from "@/lib/store-hours/sources/hours-text";
import { labelledLines } from "@/lib/store-hours/sources/labelled-lines";

export function parseEurospinHours(content: string): IParsedHours | undefined {
  const table = /timetables_container'?"?>([\s\S]*?)<\/div>/.exec(content)?.[1];
  const lines = table ? labelledLines(table) : [];

  return lines.length
    ? { weekly: weekFromLabelled(lines), dated: [] }
    : undefined;
}
