import type {
  LocationPricesResponse,
  StorePrice,
} from "@/lib/cijene-api/schemas";
import type { IPriceCache } from "@/lib/cijene-api/location-prices/price-cache";
import {
  type CityPrices,
  mergeCityPrices,
  reduceByCity,
} from "@/lib/cijene-api/location-prices/reduce-prices";

/**
 * Above this many uncached cities, one country-wide request is cheaper. Every
 * visitor shares one upstream token with a daily request quota, so the count
 * of requests matters more than their size.
 */
export const MAX_CITY_REQUESTS = 3;

/** Store prices for the scope's EANs and chains, in one city or (undefined) all */
export type FetchStorePrices = (city?: string) => Promise<StorePrice[]>;

interface ILocationPricesRequest {
  /** Sorted and comma-joined, so equal searches share cache entries */
  eans: string;
  chains: string;
  /** Exact upstream city names */
  cities: string[];
}

export async function loadLocationPrices(
  { eans, chains, cities }: ILocationPricesRequest,
  fetchStorePrices: FetchStorePrices,
  cache: IPriceCache,
): Promise<LocationPricesResponse> {
  const keyOf = (city: string) => `${eans}|${chains}|${city}`;

  const cached = new Map<string, Promise<CityPrices>>();
  for (const city of cities) {
    const hit = cache.get(keyOf(city));
    if (hit) cached.set(city, hit);
  }

  const missing = cities.filter((city) => !cached.has(city));
  const fresh =
    missing.length > MAX_CITY_REQUESTS
      ? fetchEveryCity(missing, fetchStorePrices, (city, prices) =>
          cache.set(keyOf(city), Promise.resolve(prices)),
        )
      : fetchEachCity(missing, fetchStorePrices);

  for (const [city, request] of fresh) cache.set(keyOf(city), request);

  return settle([...cached.values(), ...fresh.values()]);
}

function fetchEachCity(
  cities: string[],
  fetchStorePrices: FetchStorePrices,
): Map<string, Promise<CityPrices>> {
  return new Map(
    cities.map((city) => [
      city,
      fetchStorePrices(city).then(
        (rows) => reduceByCity(rows, new Set([city])).get(city) ?? new Map(),
      ),
    ]),
  );
}

function fetchEveryCity(
  cities: string[],
  fetchStorePrices: FetchStorePrices,
  remember: (city: string, prices: CityPrices) => void,
): Map<string, Promise<CityPrices>> {
  const requested = new Set(cities);
  const everyCity = fetchStorePrices().then((rows) => {
    const byCity = reduceByCity(rows);

    // The country-wide answer covers cities nobody has asked for yet, too.
    for (const [city, prices] of byCity)
      if (!requested.has(city)) remember(city, prices);

    return byCity;
  });

  return new Map(
    cities.map((city) => [
      city,
      everyCity.then((byCity) => byCity.get(city) ?? new Map()),
    ]),
  );
}

async function settle(
  requests: Promise<CityPrices>[],
): Promise<LocationPricesResponse> {
  const results = await Promise.allSettled(requests);
  const loaded = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const failed = results.find((result) => result.status === "rejected");

  // Nothing loaded: rethrow, so the route keeps the upstream status.
  if (failed && loaded.length === 0) throw failed.reason;

  return { prices: mergeCityPrices(loaded), partial: failed !== undefined };
}
