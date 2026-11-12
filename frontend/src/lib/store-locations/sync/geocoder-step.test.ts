import { describe, expect, it, vi } from "vitest";

import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

vi.mock("server-only", () => ({}));

const { saveResolvedLocation } = vi.hoisted(() => ({
  saveResolvedLocation: vi.fn(),
}));

vi.mock("@/lib/store-locations/location-repository", () => ({
  saveResolvedLocation,
}));

const { resolveWithGeocoder } =
  await import("@/lib/store-locations/sync/geocoder-step");

const PIN = {
  lat: 45.7156,
  lon: 16.0592,
  source: "geoapify",
  precision: "building",
} as const;

describe("resolveWithGeocoder", () => {
  it("searches with the chain's address but saves upstream's", async () => {
    const geocode = vi.fn().mockResolvedValue(PIN);
    const target: ISyncTarget = {
      chain: "stridon",
      code: "Prod.10",
      address: "Lj.Posavskog 23",
      city: "V.gorica",
      zipcode: null,
      skipGeoapify: false,
      lookup: {
        address: "Ulica Ljudevita Posavskog 23",
        city: "Velika Gorica",
      },
    };

    await resolveWithGeocoder(
      [target],
      { geocode, limit: 1, intervalMs: 0 },
      new AbortController().signal,
    );

    expect(geocode).toHaveBeenCalledWith(
      "Ulica Ljudevita Posavskog 23",
      "Velika Gorica",
      expect.any(AbortSignal),
    );
    expect(saveResolvedLocation).toHaveBeenCalledWith(target, PIN);
  });
});
