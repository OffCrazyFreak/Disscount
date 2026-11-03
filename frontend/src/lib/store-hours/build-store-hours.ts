import "server-only";

import type { DatedHoursDto, StoreHoursDto } from "@/lib/api/schemas";
import {
  hoursSourceSchema,
  storeHoursDto,
  sundayRuleSchema,
} from "@/lib/api/schemas";
import type { storeHours, storeHoursOverlay } from "@/db/store-hours-schema";
import {
  HOURS_CHAINS,
  isHoursSourceEnabled,
} from "@/lib/store-hours/hours-chains";
import { addDays, zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { storeKey } from "@/lib/store-locations/upstream-stores";

type StoreHoursRow = typeof storeHours.$inferSelect;
type OverlayRow = typeof storeHoursOverlay.$inferSelect;

// The days the status function can reach (last night's late shift, a week
// ahead), with room for a response cached for days; anything outside only
// weighs down the payload.
const DAYS_BEFORE = 2;
const DAYS_AFTER = 45;

export interface IDateWindow {
  from: string;
  to: string;
}

export function hoursWindow(now: Date): IDateWindow {
  const { date: today } = zagrebClock(now);

  return { from: addDays(today, -DAYS_BEFORE), to: addDays(today, DAYS_AFTER) };
}

// An empty store code is the chain-wide row, so it shares the key shape.
function groupOverlays(overlays: OverlayRow[], from: string, to: string) {
  const byStore = new Map<string, DatedHoursDto[]>();

  for (const overlay of overlays) {
    const source = hoursSourceSchema.safeParse(overlay.source);

    if (overlay.date < from || overlay.date > to) continue;
    if (!source.success) continue;
    if (!isHoursSourceEnabled(overlay.chainCode, source.data)) continue;

    const key = storeKey(overlay.chainCode, overlay.storeCode);
    const entry = {
      date: overlay.date,
      ranges: overlay.ranges,
      verifiedAt: overlay.verifiedAt.toISOString(),
    };

    byStore.set(key, [...(byStore.get(key) ?? []), entry]);
  }

  return byStore;
}

// Exceptions come with the weekly refresh and announcements with the later
// Sunday poll, often for the same date from the same feed, so the latest
// observation wins. On a tie the more specific layer (listed first) does:
// the store's exception, the chain's word on that store, then the chain.
function mergeDated(...layers: DatedHoursDto[][]): DatedHoursDto[] {
  const byDate = new Map<string, DatedHoursDto>();

  for (const layer of layers) {
    for (const entry of layer) {
      const kept = byDate.get(entry.date);

      if (!kept || entry.verifiedAt > kept.verifiedAt) {
        byDate.set(entry.date, entry);
      }
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// A link the checker found dead (404 or 410) gives way to the chain's
// finder; one it could not verify stays, since bot walls answer 403.
function checkUrlOf(row: StoreHoursRow): string | null {
  const finder = HOURS_CHAINS[row.chainCode]?.finderUrl ?? null;

  if (!row.checkUrl || row.linkStatus === "broken") return finder;

  return row.checkUrl;
}

/** The hours every enabled source has for each store, keyed `chain:code`. */
export function buildStoreHours(
  rows: StoreHoursRow[],
  overlays: OverlayRow[],
  { from, to }: IDateWindow,
): Record<string, StoreHoursDto> {
  const announced = groupOverlays(overlays, from, to);
  const stores: Record<string, StoreHoursDto> = {};

  for (const row of rows) {
    const source = hoursSourceSchema.safeParse(row.source);

    if (!source.success || !isHoursSourceEnabled(row.chainCode, source.data)) {
      continue;
    }

    const verifiedAt = row.verifiedAt.toISOString();
    const exceptions = row.exceptions
      .filter((entry) => entry.date >= from && entry.date <= to)
      .map((entry) => ({ ...entry, verifiedAt }));

    // One malformed row must not make the client reject every store.
    const hours = storeHoursDto.safeParse({
      weekly: row.weekly,
      dated: mergeDated(
        exceptions,
        announced.get(storeKey(row.chainCode, row.storeCode)) ?? [],
        announced.get(storeKey(row.chainCode, "")) ?? [],
      ),
      sundays: sundayRuleSchema.catch("dated").parse(row.sundays),
      source: source.data,
      verifiedAt,
      checkUrl: checkUrlOf(row),
    });

    if (hours.success) {
      stores[storeKey(row.chainCode, row.storeCode)] = hours.data;
    } else {
      console.warn(
        `[store-hours] dropped ${row.chainCode}:${row.storeCode}`,
        hours.error.issues[0],
      );
    }
  }

  return stores;
}
