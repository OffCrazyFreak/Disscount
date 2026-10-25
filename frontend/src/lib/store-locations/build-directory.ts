import "server-only";

import { DirectoryStoreDto, locationSourceSchema } from "@/lib/api/schemas";
import type { LocationSource } from "@/lib/store-locations/types";
import { StoreResponse } from "@/lib/cijene-api/schemas";
import { cleanUpstreamAddress } from "@/lib/store-locations/address-key";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { StoreLocationRow } from "@/lib/store-locations/location-repository";
import { storeKey } from "@/lib/store-locations/upstream-stores";
import { isStalePin } from "@/lib/store-locations/sync/sync-target";
import { PIN_CORRECTIONS } from "@/lib/store-locations/pin-corrections";
import { PIN_HOLDS } from "@/lib/store-locations/pin-holds";
import {
  PIN_OVERRIDES,
  usableOverride,
} from "@/lib/store-locations/pin-overrides";

/**
 * Merges upstream stores with the coordinates our sync found. A hand-placed pin
 * wins over everything: a "manual" table row first, since someone set it in
 * that environment on purpose, then a pin override from code. Otherwise
 * upstream wins when it has usable coordinates, since it is the source the
 * prices come from.
 */
export function buildDirectory(
  upstream: StoreResponse[],
  locations: StoreLocationRow[],
  overrides = PIN_OVERRIDES,
  holds = PIN_HOLDS,
  corrections = PIN_CORRECTIONS,
): DirectoryStoreDto[] {
  const byKey = new Map(
    locations.map((row) => [storeKey(row.chainCode, row.storeCode), row]),
  );

  return upstream.map((store) => {
    const key = storeKey(store.chain_code, store.code);
    const chosen = choosePin(
      correctedPin(
        savedPin(byKey.get(key), store.address),
        corrections.get(key),
        cleanUpstreamAddress(store.address),
      ),
      sanitizeCoordinates(store.lat, store.lon),
      usableOverride(overrides, key),
      holds.has(key),
    );

    return {
      chain: store.chain_code,
      code: store.code,
      type: store.type,
      address: cleanUpstreamAddress(store.address),
      city: store.city,
      zipcode: store.zipcode,
      phone: store.phone,
      lat: chosen?.point.lat ?? null,
      lon: chosen?.point.lon ?? null,
      locationSource: chosen?.source ?? null,
    };
  });
}

type Pin = { point: { lat: number; lon: number }; source: LocationSource };

// A manual table row was set in that environment on purpose, so it beats the
// reviewed list in code.
function handPlaced(
  saved: Pin | null,
  override: { lat: number; lon: number } | null,
): Pin | null {
  if (saved?.source === "manual") return saved;

  return override ? { point: override, source: "manual" } : null;
}

// A pin found from an address upstream has since changed would send people to
// the old building, so it waits for the next sync instead.
function savedPin(
  row: StoreLocationRow | undefined,
  upstreamAddress: string | null,
): Pin | null {
  if (!row || isStalePin(row, upstreamAddress)) return null;

  const point = sanitizeCoordinates(row.lat, row.lon);
  const source = locationSourceSchema.safeParse(row.source);

  return point && source.success ? { point, source: source.data } : null;
}

// Only the register pin verified wrong for this very address is replaced.
function correctedPin(
  saved: Pin | null,
  correction: { address: string; lat: number; lon: number } | undefined,
  address: string | null,
): Pin | null {
  if (saved?.source !== "dgu" || correction?.address !== address) return saved;

  return { point: { lat: correction.lat, lon: correction.lon }, source: "dgu" };
}

// A held store shows no pin until a person confirms it, unless one already
// pinned it by hand in the table.
function choosePin(
  saved: Pin | null,
  upstreamPoint: { lat: number; lon: number } | null,
  override: { lat: number; lon: number } | null,
  held: boolean,
): Pin | null {
  if (held) return saved?.source === "manual" ? saved : null;

  const pinned = handPlaced(saved, override);

  if (pinned) return pinned;
  if (upstreamPoint) return { point: upstreamPoint, source: "upstream" };

  return saved;
}
