import { describe, expect, it, vi } from "vitest";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocationRow } from "@/lib/store-locations/location-repository";

vi.mock("server-only", () => ({}));

const { buildDirectory } =
  await import("@/lib/store-locations/build-directory");
const { findSyncTargets } =
  await import("@/lib/store-locations/sync/sync-target");
const { PIN_HOLDS } = await import("@/lib/store-locations/pin-holds");

const store = {
  chain_code: "stridon",
  code: "Prod.47",
  type: "diskont",
  address: "Trg L.I.Oriovčanina",
  city: "Novska",
  zipcode: null,
  phone: null,
  lat: null,
  lon: null,
} as StoreResponse;

function row(source: string): StoreLocationRow {
  return {
    chainCode: "stridon",
    storeCode: "Prod.47",
    lat: 45.34,
    lon: 16.97,
    source,
    precision: "building",
    address: "Trg L.I.Oriovčanina",
    attempts: 0,
    lastAttemptAt: new Date(),
    geoapifyMissedAt: null,
    updatedAt: new Date(),
  };
}

describe("pin holds", () => {
  it("hide a pin the sync already saved", () => {
    const [entry] = buildDirectory([store], [row("geoapify")]);

    expect(entry).toMatchObject({ lat: null, lon: null, locationSource: null });
  });

  it("hide upstream's own coordinates too", () => {
    const placed = { ...store, lat: 45.34, lon: 16.97 };

    expect(buildDirectory([placed], [])[0].lat).toBeNull();
  });

  it("give way to a manual pin set in the database", () => {
    expect(buildDirectory([store], [row("manual")])[0]).toMatchObject({
      lat: 45.34,
      locationSource: "manual",
    });
  });

  it("keep the store out of the sync", () => {
    expect(findSyncTargets([store], [])).toEqual([]);
  });

  it("leave other stores alone", () => {
    const other = { ...store, code: "Prod.10" };

    expect(findSyncTargets([other], [])).toHaveLength(1);
  });

  it("hide every store on the shipped list and keep each out of the sync", () => {
    const held = [...PIN_HOLDS].map((key) => {
      const [chain, code] = key.split(":");

      return { ...store, chain_code: chain, code, lat: 45.5, lon: 18.5 };
    });
    const saved = held.map((one) => ({
      ...row("chain_locator"),
      chainCode: one.chain_code,
      storeCode: one.code,
    }));

    expect(held).toHaveLength(35);
    expect(
      buildDirectory(held, saved).filter((entry) => entry.lat !== null),
    ).toEqual([]);
    expect(findSyncTargets(held, [])).toEqual([]);
  });
});
