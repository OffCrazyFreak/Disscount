import "server-only";

import { DirectoryStoreDto, locationSourceSchema } from "@/lib/api/schemas";
import type { LocationSource } from "@/lib/store-locations/types";
import { StoreResponse } from "@/lib/cijene-api/schemas";
import { cleanUpstreamAddress } from "@/lib/store-locations/address-key";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { StoreLocationRow } from "@/lib/store-locations/location-repository";
import { storeKey } from "@/lib/store-locations/upstream-stores";
import { isStalePin } from "@/lib/store-locations/sync/sync-target";
import { PIN_OVERRIDES } from "@/lib/store-locations/pin-overrides";

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
): DirectoryStoreDto[] {
  const byKey = new Map(
    locations.map((row) => [storeKey(row.chainCode, row.storeCode), row]),
  );

  return upstream.map((store) => {
    const row = byKey.get(storeKey(store.chain_code, store.code));
    const upstreamPoint = sanitizeCoordinates(store.lat, store.lon);
    // A pin found from an address upstream has since changed would send
    // people to the old building, so it waits for the next sync instead.
    const savedPoint =
      row && !isStalePin(row, store.address)
        ? sanitizeCoordinates(row.lat, row.lon)
        : null;
    const savedSource = locationSourceSchema.safeParse(row?.source);

    const saved =
      savedPoint && savedSource.success
        ? { point: savedPoint, source: savedSource.data }
        : null;

    const pinned = handPlaced(
      saved,
      overrides.get(storeKey(store.chain_code, store.code)),
    );

    const chosen =
      pinned ??
      (saved && !upstreamPoint
        ? saved
        : upstreamPoint
          ? { point: upstreamPoint, source: "upstream" as const }
          : null);

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
  override: { lat: number; lon: number } | undefined,
): Pin | null {
  if (saved?.source === "manual") return saved;

  const point = override && sanitizeCoordinates(override.lat, override.lon);

  return point ? { point, source: "manual" } : null;
}
