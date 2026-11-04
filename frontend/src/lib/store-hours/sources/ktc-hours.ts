import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import { fold, weekFromLabelled } from "@/lib/store-hours/sources/hours-text";

const CLOSED_WEEK = Array.from({ length: 7 }, () => []);

/** `WorkHoures` is the feed's spelling; shops print no Sunday because they never open on one, so a week with Saturday and no Sunday closes it. */
export function parseKtcHours(text: string): IParsedHours | undefined {
  if (fold(text).includes("trajno zatvoreno")) {
    return { weekly: CLOSED_WEEK, dated: [] };
  }

  const pairs = text.split(";").flatMap((segment): [string, string][] => {
    const match = /^\s*([^:]+?)\s*:\s*(.+?)\s*$/.exec(segment);

    return match ? [[match[1], match[2]]] : [];
  });
  const weekly = weekFromLabelled(pairs);

  if (weekly.every((day) => day === null)) return undefined;
  if (weekly[5] && !weekly[6]) weekly[6] = [];

  return { weekly, dated: [] };
}
