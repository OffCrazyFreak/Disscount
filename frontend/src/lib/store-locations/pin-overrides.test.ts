import { describe, expect, it, vi } from "vitest";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocationRow } from "@/lib/store-locations/location-repository";

vi.mock("server-only", () => ({}));

const { buildDirectory } =
  await import("@/lib/store-locations/build-directory");
const { findSyncTargets } =
  await import("@/lib/store-locations/sync/sync-target");

const store = {
  chain_code: "stanic",
  code: "935",
  type: "diskont",
  address: null,
  city: "Biograd na Moru",
  zipcode: null,
  phone: null,
  lat: null,
  lon: null,
} as StoreResponse;

const OVERRIDE = { lat: 43.942276, lon: 15.4545024 };
const overrides = new Map([["stanic:935", OVERRIDE]]);

function row(source: string): StoreLocationRow {
  return {
    chainCode: "stanic",
    storeCode: "935",
    lat: 43.94,
    lon: 15.46,
    source,
    precision: "building",
    address: null,
    attempts: 0,
    lastAttemptAt: new Date(),
    geoapifyMissedAt: null,
    updatedAt: new Date(),
  };
}

describe("pin overrides", () => {
  it("win over a pin the sync found", () => {
    const [entry] = buildDirectory([store], [row("chain_locator")], overrides);

    expect(entry).toMatchObject({ ...OVERRIDE, locationSource: "manual" });
  });

  it("win over upstream's own coordinates", () => {
    const placed = { ...store, lat: 43.9, lon: 15.5 };
    const [entry] = buildDirectory([placed], [], overrides);

    expect(entry).toMatchObject({ ...OVERRIDE, locationSource: "manual" });
  });

  it("give way to a manual pin set in the database", () => {
    const [entry] = buildDirectory([store], [row("manual")], overrides);

    expect(entry).toMatchObject({ lat: 43.94, lon: 15.46 });
  });

  it("keep the store out of the sync", () => {
    expect(findSyncTargets([store], [], Date.now(), overrides)).toEqual([]);
    expect(findSyncTargets([store], [], Date.now(), new Map())).toHaveLength(1);
  });
});
