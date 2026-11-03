import "server-only";

import { and, eq, isNotNull, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  storeHours,
  storeHoursOverlay,
  storeHoursRun,
} from "@/db/store-hours-schema";
import type { HoursSource } from "@/lib/api/schemas";
import type {
  IDatedRanges,
  IParsedHours,
} from "@/lib/store-hours/sync/hours-source-types";
import type { LinkStatus } from "@/lib/store-hours/sync/link-status";
import type { RunStatus } from "@/lib/store-hours/sync/run-gate";

export type HoursJob = "template" | "overlay";

export async function saveStoreHours(
  store: { chain: string; code: string },
  hours: IParsedHours,
  source: HoursSource,
  checkUrl: string | null,
  verifiedAt: Date,
): Promise<void> {
  const fields = {
    weekly: hours.weekly,
    exceptions: hours.dated,
    sundays: hours.sundays ?? "dated",
    source,
    checkUrl,
    verifiedAt,
  };

  await db
    .insert(storeHours)
    .values({ chainCode: store.chain, storeCode: store.code, ...fields })
    .onConflictDoUpdate({
      target: [storeHours.chainCode, storeHours.storeCode],
      set: {
        ...fields,
        // A new page has not been checked yet.
        linkStatus: sql`case when ${storeHours.checkUrl} is distinct from ${checkUrl} then null else ${storeHours.linkStatus} end`,
        linkFailures: sql`case when ${storeHours.checkUrl} is distinct from ${checkUrl} then 0 else ${storeHours.linkFailures} end`,
      },
      // A chain's own hours always replace OpenStreetMap's, never the reverse.
      setWhere:
        source === "osm" ? sql`${storeHours.source} = 'osm'` : undefined,
    });
}

export async function saveOverlay(
  store: { chain: string; code: string },
  days: IDatedRanges[],
  verifiedAt: Date,
): Promise<void> {
  for (const day of days) {
    const fields = { ranges: day.ranges, source: "chain", verifiedAt };

    await db
      .insert(storeHoursOverlay)
      .values({
        chainCode: store.chain,
        storeCode: store.code,
        date: day.date,
        ...fields,
      })
      .onConflictDoUpdate({
        target: [
          storeHoursOverlay.chainCode,
          storeHoursOverlay.storeCode,
          storeHoursOverlay.date,
        ],
        set: fields,
      });
  }
}

/** Announcements for days already past only weigh down every read. */
export async function deleteOverlaysBefore(date: string): Promise<void> {
  await db.delete(storeHoursOverlay).where(lt(storeHoursOverlay.date, date));
}

export async function readAcceptedCount(
  job: HoursJob,
  chain: string,
): Promise<number | null> {
  const [row] = await db
    .select({ count: storeHoursRun.acceptedCount })
    .from(storeHoursRun)
    .where(and(eq(storeHoursRun.job, job), eq(storeHoursRun.chainCode, chain)));

  return row?.count ?? null;
}

export async function recordRun(
  job: HoursJob,
  chain: string,
  status: RunStatus,
  count: number | null,
  error: string | null = null,
): Promise<void> {
  const now = new Date();
  const accepted =
    status === "accepted" ? { acceptedCount: count, acceptedAt: now } : {};
  const fields = {
    lastCount: count,
    lastStatus: status,
    lastError: error,
    lastRunAt: now,
    ...accepted,
  };

  await db
    .insert(storeHoursRun)
    .values({ job, chainCode: chain, ...fields })
    .onConflictDoUpdate({
      target: [storeHoursRun.job, storeHoursRun.chainCode],
      set: fields,
    });
}

export async function readCheckUrls(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ url: storeHours.checkUrl })
    .from(storeHours)
    .where(isNotNull(storeHours.checkUrl));

  return rows.flatMap((row) => (row.url ? [row.url] : []));
}

/** Every store sharing the link gets its verdict; failures count up until a check succeeds. */
export async function saveLinkStatus(
  url: string,
  status: LinkStatus,
): Promise<void> {
  await db
    .update(storeHours)
    .set({
      linkStatus: status,
      linkCheckedAt: new Date(),
      linkFailures: status === "ok" ? 0 : sql`${storeHours.linkFailures} + 1`,
    })
    .where(eq(storeHours.checkUrl, url));
}
