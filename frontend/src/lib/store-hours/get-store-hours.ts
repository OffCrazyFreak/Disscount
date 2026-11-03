import "server-only";

import { db } from "@/db";
import { storeHours, storeHoursOverlay } from "@/db/store-hours-schema";
import type { StoreHoursResponse } from "@/lib/api/schemas";
import {
  buildStoreHours,
  hoursWindow,
} from "@/lib/store-hours/build-store-hours";
import { croatianHolidaysBetween } from "@/lib/store-hours/croatian-holidays";

// Per process, like the store directory: hours change weekly at most, and
// the Sunday poll lands within the hour.
const MEMO_MS = 10 * 60 * 1000;

let memo: { value: StoreHoursResponse; at: number } | null = null;

/** Every store's hours with the holidays the status function needs. */
export async function getStoreHours(): Promise<StoreHoursResponse> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;

  const now = new Date();
  const window = hoursWindow(now);
  const [rows, overlays] = await Promise.all([
    db.select().from(storeHours),
    db.select().from(storeHoursOverlay),
  ]);
  const value = {
    stores: buildStoreHours(rows, overlays, window),
    holidays: croatianHolidaysBetween(window.from, window.to),
    generatedAt: now.toISOString(),
  };

  memo = { value, at: Date.now() };

  return value;
}
