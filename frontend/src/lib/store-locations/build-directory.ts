import "server-only";

import { DirectoryStoreDto, locationSourceSchema } from "@/lib/api/schemas";
import { StoreResponse } from "@/lib/cijene-api/schemas";
import { cleanUpstreamAddress } from "@/lib/store-locations/address-key";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { StoreLocationRow } from "@/lib/store-locations/location-repository";
import { storeKey } from "@/lib/store-locations/upstream-stores";

/**
 * Merges upstream stores with the coordinates our sync found. A hand-placed pin
 * wins over everything; otherwise upstream wins when it has usable
 * coordinates, since it is the source the prices come from.
 */
export function buildDirectory(
  upstream: StoreResponse[],
  locations: StoreLocationRow[],
): DirectoryStoreDto[] {
  const byKey = new Map(
    locations.map((row) => [storeKey(row.chainCode, row.storeCode), row]),
  );

  return upstream.map((store) => {
    const row = byKey.get(storeKey(store.chain_code, store.code));
    const upstreamPoint = sanitizeCoordinates(store.lat, store.lon);
    const savedPoint = row ? sanitizeCoordinates(row.lat, row.lon) : null;
    const savedSource = locationSourceSchema.safeParse(row?.source);

    const saved =
      savedPoint && savedSource.success
        ? { point: savedPoint, source: savedSource.data }
        : null;

    const chosen =
      saved && (saved.source === "manual" || !upstreamPoint)
        ? saved
        : upstreamPoint
          ? { point: upstreamPoint, source: "upstream" as const }
          : null;

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
