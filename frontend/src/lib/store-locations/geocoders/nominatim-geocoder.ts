import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { IResolvedLocation } from "@/lib/store-locations/store-location-types";
import {
  houseNumberMatches,
  requestedHouseNumber,
} from "@/lib/store-locations/geocoders/house-number";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// scripts running regularly are limited to 4 requests per minute. The caller
// paces calls with this; geocodeWithNominatim itself makes exactly one request.
export const NOMINATIM_MIN_INTERVAL_MS = 15_000;

const BUILDING_TYPES = new Set([
  "building",
  "house",
  "shop",
  "amenity",
  "office",
]);

const resultSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  category: z.string().optional(),
  type: z.string().optional(),
  addresstype: z.string().optional(),
  address: z
    .object({ house_number: z.string().optional() })
    .partial()
    .optional(),
});

function isBuildingLike(result: z.infer<typeof resultSchema>): boolean {
  return [result.addresstype, result.category, result.type].some(
    (value) => value !== undefined && BUILDING_TYPES.has(value),
  );
}

export async function geocodeWithNominatim(
  address: string,
  city: string | null,
  signal: AbortSignal,
): Promise<IResolvedLocation | null> {
  const params = new URLSearchParams({
    street: address,
    countrycodes: "hr",
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
    "accept-language": "hr",
  });

  if (city) params.set("city", city);

  const parsed = z
    .array(resultSchema)
    .safeParse(await fetchJson(`${ENDPOINT}?${params}`, signal));
  const result = parsed.success ? parsed.data[0] : undefined;

  if (!result) return null;

  const coordinates = sanitizeCoordinates(
    Number(result.lat),
    Number(result.lon),
  );

  if (!coordinates) return null;

  const wanted = requestedHouseNumber(address);

  if (!wanted) return null;

  const exact =
    isBuildingLike(result) &&
    houseNumberMatches(wanted, result.address?.house_number);

  return exact
    ? { ...coordinates, source: "nominatim", precision: "building" }
    : null;
}
