import "server-only";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import { isHoursSourceEnabled } from "@/lib/store-hours/hours-chains";
import { hoursSources } from "@/lib/store-hours/sources/hours-sources";
import type { IHoursSource } from "@/lib/store-hours/sync/hours-source-types";
import {
  type HoursJob,
  readAcceptedCount,
  recordRun,
  saveOverlay,
  saveStoreHours,
} from "@/lib/store-hours/sync/hours-repository";
import {
  type IMatchedHours,
  matchHours,
} from "@/lib/store-hours/sync/match-hours";
import { gateRun } from "@/lib/store-hours/sync/run-gate";
import { storeKey } from "@/lib/store-locations/upstream-stores";

async function saveMatched(
  job: HoursJob,
  matched: IMatchedHours[],
  isOverlayDay: (date: string) => boolean,
): Promise<void> {
  const now = new Date();

  for (const { chain, code, record } of matched) {
    if (job === "template") {
      await saveStoreHours(
        { chain, code },
        record.hours,
        "chain",
        record.pageUrl ?? null,
        now,
      );
    } else {
      const days = record.hours.dated.filter((day) => isOverlayDay(day.date));

      await saveOverlay({ chain, code }, days, now);
    }
  }
}

async function runSource(
  job: HoursJob,
  source: IHoursSource,
  upstream: StoreResponse[],
  isOverlayDay: (date: string) => boolean,
  signal: AbortSignal,
): Promise<IMatchedHours[]> {
  const codes = new Set(
    upstream
      .filter((store) => store.chain_code === source.chain)
      .map((store) => store.code),
  );
  const records = await source.fetchHours(signal, codes);
  const matched = matchHours(source.chain, records, upstream);
  const status = gateRun(
    matched.length,
    await readAcceptedCount(job, source.chain),
  );

  if (status === "accepted") await saveMatched(job, matched, isOverlayDay);
  else
    console.warn(
      `[store-hours] ${job} ${source.chain} rejected: ${matched.length} stores`,
    );

  await recordRun(job, source.chain, status, matched.length);

  return status === "accepted" ? matched : [];
}

/**
 * Reads every enabled chain's hours and saves what matches upstream: the
 * whole template for the weekly job, only the Sunday and holiday days for
 * the overlay job. A chain failing or failing the gate keeps its old data.
 * Returns the stores that now have the chain's own hours.
 */
export async function runChainSources(
  job: HoursJob,
  upstream: StoreResponse[],
  isOverlayDay: (date: string) => boolean,
  signal: AbortSignal,
): Promise<Set<string>> {
  const covered = new Set<string>();

  for (const source of hoursSources) {
    if (!isHoursSourceEnabled(source.chain, "chain")) {
      await recordRun(job, source.chain, "disabled", null);
      continue;
    }

    try {
      const matched = await runSource(
        job,
        source,
        upstream,
        isOverlayDay,
        signal,
      );

      for (const { chain, code } of matched) covered.add(storeKey(chain, code));
    } catch (error) {
      console.warn(`[store-hours] ${job} ${source.chain} failed`, error);
      await recordRun(job, source.chain, "failed", null, String(error));
    }
  }

  return covered;
}
