import "server-only";

import { geocodeWithGeoapify } from "@/lib/store-locations/geocoders/geoapify-geocoder";
import type { IResolvedLocation } from "@/lib/store-locations/types";

type Geocode = (
  address: string,
  city: string | null,
  signal: AbortSignal,
) => Promise<IResolvedLocation | null>;

/**
 * Geoapify for one sync run, shared by the DGU anchor and the geocoder step:
 * an address asked twice costs one request, and the run's limit counts both.
 * Past the limit it throws, so the store is retried next run rather than
 * recorded as a miss.
 */
export function createGeoapifyBudget(
  limit: number,
  geocode: Geocode = geocodeWithGeoapify,
): Geocode {
  const answers = new Map<string, Promise<IResolvedLocation | null>>();
  let spent = 0;

  return (address, city, signal) => {
    const key = `${address}\n${city ?? ""}`;
    const known = answers.get(key);

    if (known) return known;
    if (spent >= limit) throw new Error("Geoapify limit for this run reached");

    spent++;

    const answer = geocode(address, city, signal);

    answers.set(key, answer);
    answer.catch(() => answers.delete(key));

    return answer;
  };
}
