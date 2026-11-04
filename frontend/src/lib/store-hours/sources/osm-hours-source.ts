import "server-only";

import { z } from "zod";

import { storeNamesMap } from "@/constants/name-mappings";
import { fold } from "@/lib/store-hours/sources/hours-text";
import { parseOsmOpeningHours } from "@/lib/store-hours/sources/osm-opening-hours";
import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";
import { delay, fetchJson } from "@/lib/store-locations/http";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Branded food and drug shops in Croatia with hours; ways come as their centre.
const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="HR"][admin_level=2]->.hr;
(
  nwr["shop"~"^(supermarket|convenience|chemist)$"]["opening_hours"]["brand"](area.hr);
);
out center tags;`;

// The query itself may run three minutes (its own timeout), plus the download.
const QUERY_TIMEOUT_MS = 4 * 60 * 1000;

// The public server answers 429 and 504 when busy; it asks clients to back off.
const RETRY_DELAYS_MS = [30_000, 120_000];

const elementSchema = z.object({
  type: z.string(),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()),
});

// Brands OSM writes differently from our chain names.
const BRAND_ALIASES: Record<string, string> = {
  interspar: "spar",
  "spar express": "spar",
  stanic: "stanic",
  "diskont stanic": "stanic",
};

const chainByBrand = new Map(
  Object.entries(storeNamesMap).map(([chain, name]) => [fold(name), chain]),
);

function chainOf(brand: string): string | undefined {
  const folded = fold(brand);

  return BRAND_ALIASES[folded] ?? chainByBrand.get(folded);
}

export interface IOsmShop {
  chain: string;
  lat: number;
  lon: number;
  hours: IParsedHours;
}

async function queryOverpass(signal: AbortSignal): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchJson(
        OVERPASS_URL,
        signal,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(QUERY)}`,
        },
        QUERY_TIMEOUT_MS,
      );
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || signal.aborted) throw error;

      await delay(RETRY_DELAYS_MS[attempt], signal);
    }
  }
}

/** ODbL, credited on the map. */
export async function fetchOsmShops(signal: AbortSignal): Promise<IOsmShop[]> {
  const payload = z
    .object({ elements: z.array(z.unknown()) })
    .parse(await queryOverpass(signal));

  return payload.elements.flatMap((raw) => {
    const element = elementSchema.safeParse(raw);

    if (!element.success) return [];

    const { tags } = element.data;
    const point = element.data.center ?? element.data;
    const chain = tags.brand ? chainOf(tags.brand) : undefined;
    const weekly = parseOsmOpeningHours(tags.opening_hours ?? "");

    if (
      !chain ||
      !weekly ||
      point.lat === undefined ||
      point.lon === undefined
    ) {
      return [];
    }

    return [
      { chain, lat: point.lat, lon: point.lon, hours: { weekly, dated: [] } },
    ];
  });
}
