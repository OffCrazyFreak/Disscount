import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type {
  IResolvedLocation,
  LocationPrecision,
} from "@/lib/store-locations/types";
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

function toPrecision(
  resultType: string | undefined,
  matchesNumber: boolean,
): LocationPrecision | null {
  switch (resultType) {
    case "building":
    case "amenity":
      return matchesNumber ? "building" : "street";
    case "street":
      return "street";
    case "city":
    case "postcode":
    case "suburb":
    case "district":
      return "settlement";
    default:
      return null;
  }
}

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
  const matchesNumber =
    wanted !== null && houseNumberMatches(wanted, result.housenumber);
  const precision = toPrecision(result.result_type, matchesNumber);
  const coordinates = sanitizeCoordinates(result.lat, result.lon);

  if (!precision || !coordinates) return null;

  // Same rule as Nominatim: a store with a house number gets that building
  // or nothing, never the middle of its street.
  if (wanted !== null && precision !== "building") return null;

  return { ...coordinates, source: "geoapify", precision };
}
