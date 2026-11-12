import type { z } from "zod";

import type { locationSourceSchema } from "@/lib/api/schemas";
import type { IParsedHours } from "@/lib/store-hours/sync/hours-source-types";

/** Where a store's coordinates came from, best first. */
export type LocationSource = z.infer<typeof locationSourceSchema>;

/** How exactly the coordinates pin the store. */
export type LocationPrecision = "building" | "street" | "settlement";

export interface ILocatorStore {
  /** The chain's store id, only when it equals the cijene-api store code. */
  code?: string;
  /** Upstream codes end with it after one more digit (NTL's "BR. 350" is code 20350), so it is weaker than a code. */
  codeSuffix?: string;
  /** The point stands for the street or village, not the building. */
  approximate?: boolean;
  address: string;
  city?: string;
  zipcode?: string;
  lat: number;
  lon: number;
  /** Opening hours, where the locator publishes them; the location sync ignores them. */
  hours?: IParsedHours;
  /** The store's own page on the chain's site. */
  pageUrl?: string;
}

export interface IStoreLocator {
  /** The cijene-api chain code this locator covers. */
  chain: string;
  fetchStores(signal: AbortSignal): Promise<ILocatorStore[]>;
}

export interface IResolvedLocation {
  lat: number;
  lon: number;
  source: LocationSource;
  precision: LocationPrecision;
}

/** A chain's own spelling of a store's address, for geocoders only. */
export interface ILookupAddress {
  address: string;
  city: string;
}
