import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { IResolvedLocation } from "@/lib/store-locations/types";
import {
  geoapifyQuery,
  geoapifyResultSchema,
  pickGeoapifyResult,
} from "@/lib/store-locations/geocoders/geoapify-query";

const ENDPOINT = "https://api-eu.geoapify.com/v1/geocode/search";

const responseSchema = z.object({
  results: z.array(geoapifyResultSchema).default([]),
});

// Same rule as Nominatim: a wrong pin is worse than none, so only the
// building with the right house number is accepted, never a street, a town
// centre or a near miss.
export async function geocodeWithGeoapify(
  address: string,
  city: string | null,
  signal: AbortSignal,
): Promise<IResolvedLocation | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) return null;

  const { text, houseNumber } = geoapifyQuery(address, city);

  // Without a house number no result can pass, so no request is spent.
  if (houseNumber === null) return null;

  const params = new URLSearchParams({
    text,
    filter: "countrycode:hr",
    lang: "hr",
    limit: "5",
    format: "json",
    apiKey,
  });

  const parsed = responseSchema.safeParse(
    await fetchJson(`${ENDPOINT}?${params}`, signal),
  );
  const result = parsed.success
    ? pickGeoapifyResult(parsed.data.results, houseNumber)
    : undefined;
  const coordinates = result && sanitizeCoordinates(result.lat, result.lon);

  if (!coordinates) return null;

  return { ...coordinates, source: "geoapify", precision: "building" };
}
