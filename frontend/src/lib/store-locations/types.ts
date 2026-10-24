/** Where a store's coordinates came from, best first. */
export type LocationSource =
  "upstream" | "chain_locator" | "dgu" | "geoapify" | "nominatim" | "manual";

/** How exactly the coordinates pin the store. */
export type LocationPrecision = "building" | "street" | "settlement";

/** One store as a chain's own store locator publishes it. */
export interface ILocatorStore {
  /** The chain's store id, only when it equals the cijene-api store code. */
  code?: string;
  /**
   * The chain's store number when upstream codes end with it after one more
   * digit (NTL's "BR. 350" is code 20350). Weaker than a code.
   */
  codeSuffix?: string;
  address: string;
  city?: string;
  zipcode?: string;
  lat: number;
  lon: number;
}

/** Reads every store a chain publishes, with coordinates. */
export interface IStoreLocator {
  /** The cijene-api chain code this locator covers. */
  chain: string;
  fetchStores(signal: AbortSignal): Promise<ILocatorStore[]>;
}

/** Coordinates resolved for one cijene-api store. */
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
  zipcode?: string;
}
