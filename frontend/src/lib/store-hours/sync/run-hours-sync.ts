import "server-only";

import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";
import {
  acquireSyncLease,
  type ISyncLease,
  isSyncDue,
  releaseSyncLease,
} from "@/lib/store-locations/sync/sync-lease";
import { fetchUpstreamStores } from "@/lib/store-locations/upstream-stores";
import { croatianHolidaysBetween } from "@/lib/store-hours/croatian-holidays";
import { runChainSources } from "@/lib/store-hours/sync/chain-step";
import { deleteOverlaysBefore } from "@/lib/store-hours/sync/hours-repository";
import { runLinkCheck } from "@/lib/store-hours/sync/link-check";
import { runOsmStep } from "@/lib/store-hours/sync/osm-step";
import {
  addDays,
  isoWeekday,
  SUNDAY,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

// Weekly: templates rarely change, and two missed weeks mark data stale.
const TEMPLATE_LEASE: ISyncLease = {
  id: "store-hours-template",
  every: "7 days",
};

// Daily on poll days: chains announce a working Sunday a few days ahead.
const OVERLAY_LEASE: ISyncLease = {
  id: "store-hours-overlay",
  every: "20 hours",
};

// Weekly like the template, as the owner's plan set the link checker's schedule.
const LINK_LEASE: ISyncLease = { id: "store-hours-links", every: "7 days" };

const THURSDAY = 3;

function sundayOrHoliday(today: string) {
  const holidays = new Set(croatianHolidaysBetween(today, addDays(today, 14)));

  return (date: string) => isoWeekday(date) === SUNDAY || holidays.has(date);
}

/** The weekly refresh: every chain's template and dated days, then OpenStreetMap for the rest. */
async function runTemplateSync(signal: AbortSignal): Promise<void> {
  if (!(await acquireSyncLease(TEMPLATE_LEASE))) return;

  let failure: string | null = null;

  try {
    const today = zagrebClock(new Date()).date;
    const upstream = await fetchUpstreamStores();
    const covered = await runChainSources(
      "template",
      upstream,
      sundayOrHoliday(today),
      signal,
    );
    const { stores } = await getStoreDirectory();

    await runOsmStep(stores, covered, signal);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    console.error("[store-hours] template sync failed", error);
  } finally {
    await releaseSyncLease(failure, TEMPLATE_LEASE);
  }
}

/** Thursday to Saturday: only the Sunday and holiday days, from the same feeds. */
async function runOverlaySync(signal: AbortSignal): Promise<void> {
  const today = zagrebClock(new Date()).date;

  if (isoWeekday(today) < THURSDAY || isoWeekday(today) === SUNDAY) return;
  if (!(await acquireSyncLease(OVERLAY_LEASE))) return;

  let failure: string | null = null;

  try {
    await runChainSources(
      "overlay",
      await fetchUpstreamStores(),
      sundayOrHoliday(today),
      signal,
    );
    await deleteOverlaysBefore(addDays(today, -7));
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    console.error("[store-hours] overlay sync failed", error);
  } finally {
    await releaseSyncLease(failure, OVERLAY_LEASE);
  }
}

async function runLinkSync(signal: AbortSignal): Promise<void> {
  if (!(await acquireSyncLease(LINK_LEASE))) return;

  let failure: string | null = null;

  try {
    await runLinkCheck(signal);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    console.error("[store-hours] link check failed", error);
  } finally {
    await releaseSyncLease(failure, LINK_LEASE);
  }
}

type HoursJobName = "template" | "overlay" | "links";

/** Which job, if any, a request should start now. */
export async function dueHoursJob(): Promise<HoursJobName | null> {
  if (await isSyncDue(TEMPLATE_LEASE)) return "template";

  const weekday = isoWeekday(zagrebClock(new Date()).date);
  const pollDay = weekday >= THURSDAY && weekday !== SUNDAY;

  if (pollDay && (await isSyncDue(OVERLAY_LEASE))) return "overlay";

  return (await isSyncDue(LINK_LEASE)) ? "links" : null;
}

const JOBS: Record<HoursJobName, (signal: AbortSignal) => Promise<void>> = {
  template: runTemplateSync,
  overlay: runOverlaySync,
  links: runLinkSync,
};

export function runHoursJob(job: HoursJobName, signal: AbortSignal) {
  return JOBS[job](signal);
}
