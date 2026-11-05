import "server-only";

import { after } from "next/server";

import { db } from "@/db";
import { storeHours, storeHoursOverlay } from "@/db/store-hours-schema";
import type { CompactStoreHoursResponse } from "@/lib/api/schemas";
import {
  buildStoreHours,
  hoursWindow,
} from "@/lib/store-hours/build-store-hours";
import { encodeStoreHours } from "@/lib/store-hours/compact-store-hours";
import { croatianHolidaysBetween } from "@/lib/store-hours/croatian-holidays";
import {
  dueHoursJob,
  runHoursJob,
  TEMPLATE_LEASE,
} from "@/lib/store-hours/sync/run-hours-sync";
import { hasSyncFinished } from "@/lib/store-locations/sync/sync-lease";

// Per process, like the store directory: hours change weekly at most, and
// the Sunday poll lands within the hour.
const MEMO_MS = 10 * 60 * 1000;

// Under the lease's two hours, so a stuck run is cut before another may start.
const JOB_TIMEOUT_MS = 90 * 60 * 1000;

let memo: { value: CompactStoreHoursResponse; at: number } | null = null;
let jobRunning = false;
let importedOnce = false;

/**
 * Every store's hours with the holidays the status function needs. Before
 * the first import has finished the set is empty or partial, so it is marked
 * incomplete and nobody may cache it.
 */
export async function getStoreHours(): Promise<{
  hours: CompactStoreHoursResponse;
  complete: boolean;
}> {
  after(startHoursJobIfDue);

  if (memo && Date.now() - memo.at < MEMO_MS) {
    return { hours: memo.value, complete: true };
  }

  const now = new Date();
  const window = hoursWindow(now);
  const [rows, overlays, imported] = await Promise.all([
    db.select().from(storeHours),
    db.select().from(storeHoursOverlay),
    importedOnce || hasSyncFinished(TEMPLATE_LEASE),
  ]);
  const value = encodeStoreHours({
    stores: buildStoreHours(rows, overlays, window),
    holidays: croatianHolidaysBetween(window.from, window.to),
    generatedAt: now.toISOString(),
  });

  importedOnce = imported;
  const complete = imported && rows.length > 0;

  if (complete) memo = { value, at: Date.now() };

  return { hours: value, complete };
}

/**
 * Like the location sync, the refresh has no cron: a request after the
 * data is due starts it once the response is sent, and the lease keeps a
 * second instance out.
 */
async function startHoursJobIfDue(): Promise<void> {
  if (jobRunning) return;

  jobRunning = true;

  try {
    const job = await dueHoursJob();

    if (!job) return;

    await runHoursJob(job, AbortSignal.timeout(JOB_TIMEOUT_MS));
    memo = null;
  } finally {
    jobRunning = false;
  }
}
