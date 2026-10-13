import { describe, expect, it, vi } from "vitest";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocationRow } from "@/lib/store-locations/location-repository";

vi.mock("server-only", () => ({}));

const { buildDirectory } =
  await import("@/lib/store-locations/build-directory");
const { findSyncTargets } =
  await import("@/lib/store-locations/sync/sync-target");

const store = {
  chain_code: "spar",
  code: "S1",
  type: "supermarket",
  address: "Ilica 10",
  city: "Zagreb",
  zipcode: "10000",
  phone: null,
  lat: null,
  lon: null,
} as StoreResponse;

function pin(address: string | null, source = "dgu"): StoreLocationRow {
  return {
    chainCode: "spar",
    storeCode: "S1",
    lat: 45.81,
    lon: 15.97,
    source,
    precision: "building",
    address,
    attempts: 0,
    lastAttemptAt: new Date(),
    geoapifyMissedAt: null,
    updatedAt: new Date(),
  };
}

describe("a pin found from an address upstream has since changed", () => {
  const moved = { ...store, address: "Vukovarska 5" };

  it("is looked up again by the sync", () => {
    expect(findSyncTargets([moved], [pin("Ilica 10")])).toHaveLength(1);
    expect(findSyncTargets([store], [pin("Ilica 10")])).toHaveLength(0);
  });

  it("is left off the map until then", () => {
    expect(buildDirectory([moved], [pin("Ilica 10")])[0].lat).toBeNull();
    expect(buildDirectory([store], [pin("Ilica 10")])[0].lat).toBe(45.81);
  });

  it("never applies to a manual pin or one saved without an address", () => {
    expect(buildDirectory([moved], [pin("Ilica 10", "manual")])[0].lat).toBe(
      45.81,
    );
    expect(buildDirectory([moved], [pin(null)])[0].lat).toBe(45.81);
  });
});
