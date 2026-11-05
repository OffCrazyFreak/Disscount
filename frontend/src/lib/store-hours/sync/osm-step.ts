import "server-only";

import type { DirectoryStoreDto } from "@/lib/api/schemas";
import {
  fetchOsmShops,
  type IOsmShop,
} from "@/lib/store-hours/sources/osm-hours-source";
import { isHoursSourceEnabled } from "@/lib/store-hours/hours-chains";
import {
  readAcceptedCount,
  recordRun,
  saveStoreHours,
} from "@/lib/store-hours/sync/hours-repository";
import { gateRun } from "@/lib/store-hours/sync/run-gate";
import { storeKey } from "@/lib/store-locations/upstream-stores";
import { distanceKm } from "@/utils/distance";

// The card's measurement: matched OSM shops sit a median 33 m from our pin.
const MAX_DISTANCE_KM = 0.15;

function nearestShop(
  store: DirectoryStoreDto,
  shops: IOsmShop[],
): IOsmShop | null {
  const pin = { lat: store.lat!, lon: store.lon! };
  const near = shops
    .filter((shop) => shop.chain === store.chain)
    .map((shop) => ({ shop, km: distanceKm(pin, shop) }))
    .filter(({ km }) => km <= MAX_DISTANCE_KM)
    .sort((a, b) => a.km - b.km);

  // Two shops of the same chain this close cannot be told apart.
  if (near.length > 1 && near[1].km - near[0].km < 0.03) return null;

  return near[0]?.shop ?? null;
}

/** A chain's own row is never replaced, because `saveStoreHours` guards it. */
export async function runOsmStep(
  directory: DirectoryStoreDto[],
  covered: ReadonlySet<string>,
  signal: AbortSignal,
): Promise<void> {
  if (!isHoursSourceEnabled("", "osm")) return;

  try {
    const shops = await fetchOsmShops(signal);
    const matches = directory.flatMap((store) => {
      if (store.lat == null || store.lon == null) return [];
      if (covered.has(storeKey(store.chain, store.code))) return [];

      const shop = nearestShop(store, shops);

      return shop ? [{ store, shop }] : [];
    });
    const status = gateRun(
      matches.length,
      await readAcceptedCount("template", "osm"),
    );

    if (status === "accepted") {
      const now = new Date();

      for (const { store, shop } of matches) {
        await saveStoreHours(
          { chain: store.chain, code: store.code },
          shop.hours,
          "osm",
          null,
          now,
        );
      }
    }

    await recordRun("template", "osm", status, matches.length);
  } catch (error) {
    console.warn("[store-hours] OpenStreetMap step failed", error);
    await recordRun("template", "osm", "failed", null, String(error));
  }
}
