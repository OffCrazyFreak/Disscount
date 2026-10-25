import { describe, expect, it, vi } from "vitest";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocationRow } from "@/lib/store-locations/location-repository";

vi.mock("server-only", () => ({}));

const { buildDirectory } =
  await import("@/lib/store-locations/build-directory");
const { PIN_CORRECTIONS } =
  await import("@/lib/store-locations/pin-corrections");

const store = {
  chain_code: "metro",
  code: "S10",
  address: "Jankomir 31",
  city: "Zagreb",
  lat: null,
  lon: null,
} as StoreResponse;

const RIGHT = { address: "Jankomir 31", lat: 45.7998556, lon: 15.8810342 };
const corrections = new Map([["metro:S10", RIGHT]]);

function row(source: string, address = "Jankomir 31"): StoreLocationRow {
  return {
    chainCode: "metro",
    storeCode: "S10",
    lat: 45.8001,
    lon: 15.9843,
    source,
    address,
  } as StoreLocationRow;
}

function pinFor(saved: StoreLocationRow, upstream = store) {
  const [entry] = buildDirectory(
    [upstream],
    [saved],
    new Map(),
    new Set(),
    corrections,
  );

  return { lat: entry.lat, lon: entry.lon, source: entry.locationSource };
}

describe("pin corrections", () => {
  it("moves a saved register pin to the verified place", () => {
    expect(pinFor(row("dgu"))).toEqual({
      lat: RIGHT.lat,
      lon: RIGHT.lon,
      source: "dgu",
    });
  });

  it("leaves pins from other sources alone", () => {
    expect(pinFor(row("manual")).lon).toBe(15.9843);
    expect(pinFor(row("geoapify")).lon).toBe(15.9843);
  });

  it("stops applying once upstream changes the address", () => {
    const moved = { ...store, address: "Jankomir 33" };

    expect(pinFor(row("dgu", "Jankomir 33"), moved).lon).toBe(15.9843);
  });

  it("ships only points inside Croatia", () => {
    for (const { lat, lon } of PIN_CORRECTIONS.values()) {
      expect(lat).toBeGreaterThan(42);
      expect(lon).toBeGreaterThan(13);
    }
    expect(PIN_CORRECTIONS.size).toBe(14);
  });
});
