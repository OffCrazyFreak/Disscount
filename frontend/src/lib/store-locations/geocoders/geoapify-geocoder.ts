import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { IResolvedLocation } from "@/lib/store-locations/types";
import {
  houseNumberMatches,
  requestedHouseNumber,
} from "@/lib/store-locations/geocoders/house-number";

const ENDPOINT = "https://api-eu.geoapify.com/v1/geocode/search";

// Geoapify's docs say a low confidence does not mean a wrong answer, but a
// wrong pin is worse than no pin, so doubtful results are dropped.
const MIN_CONFIDENCE = 0.6;

const responseSchema = z.object({
  results: z
    .array(
      z.object({
        lat: z.number(),
        lon: z.number(),
        result_type: z.string().optional(),
        housenumber: z.string().optional(),
        rank: z.object({ confidence: z.number().optional() }).optional(),
      }),
    )
    .default([]),
});

// Same rule as Nominatim: a wrong pin is worse than none, so a street, a town
// centre or the wrong building is dropped and the store waits for a better
// source or a manual pin.
const BUILDING_TYPES = new Set(["building", "amenity"]);

export async function geocodeWithGeoapify(
  address: string,
  city: string | null,
  signal: AbortSignal,
): Promise<IResolvedLocation | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) return null;

  const params = new URLSearchParams({
    text: [address, city, "Hrvatska"].filter(Boolean).join(", "),
    filter: "countrycode:hr",
    lang: "hr",
    limit: "1",
    format: "json",
    apiKey,
  });

  const parsed = responseSchema.safeParse(
    await fetchJson(`${ENDPOINT}?${params}`, signal),
  );
  const result = parsed.success ? parsed.data.results[0] : undefined;

  if (!result || (result.rank?.confidence ?? 0) < MIN_CONFIDENCE) return null;

  const wanted = requestedHouseNumber(address);
  const exact =
    wanted !== null &&
    BUILDING_TYPES.has(result.result_type ?? "") &&
    houseNumberMatches(wanted, result.housenumber);
  const coordinates = sanitizeCoordinates(result.lat, result.lon);

  if (!exact || !coordinates) return null;

  return { ...coordinates, source: "geoapify", precision: "building" };
}
