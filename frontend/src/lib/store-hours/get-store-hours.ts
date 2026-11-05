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
} from "@/lib/store-hours/sync/run-hours-sync";

// Per process: hours change weekly at most, and the Sunday poll lands within the hour.
const MEMO_MS = 10 * 60 * 1000;

// Under the lease's two hours, so a stuck run is cut before another may start.
const JOB_TIMEOUT_MS = 90 * 60 * 1000;

let memo: { value: CompactStoreHoursResponse; at: number } | null = null;
let jobRunning = false;

export async function getStoreHours(): Promise<CompactStoreHoursResponse> {
  after(startHoursJobIfDue);

  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;

  const now = new Date();
  const window = hoursWindow(now);
  const [rows, overlays] = await Promise.all([
    db.select().from(storeHours),
    db.select().from(storeHoursOverlay),
  ]);
  const value = encodeStoreHours({
    stores: buildStoreHours(rows, overlays, window),
    holidays: croatianHolidaysBetween(window.from, window.to),
    generatedAt: now.toISOString(),
  });

  memo = { value, at: Date.now() };

  return value;
}

/** No cron: a due request starts it after responding, and the lease keeps out a second instance. */
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
