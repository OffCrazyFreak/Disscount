import { describe, expect, it, vi } from "vitest";

import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type { ILocatorStore } from "@/lib/store-locations/types";

vi.mock("server-only", () => ({}));
vi.stubEnv("GEOAPIFY_API_KEY", "");

const { createDguAnchor } =
  await import("@/lib/store-locations/sync/dgu-anchor");

const target: ISyncTarget = {
  chain: "ntl",
  code: "20350",
  address: "Kralja Tomislava 12",
  city: "Našice",
  zipcode: null,
  skipGeoapify: false,
};

function record(extra: Partial<ILocatorStore>, lat = 45.49): ILocatorStore {
  return { address: "Kralja Tomislava 12", lat, lon: 18.09, ...extra };
}

function anchorWith(records: ILocatorStore[]) {
  return createDguAnchor(
    new Map([["ntl", records]]),
    new AbortController().signal,
  )(target);
}

describe("createDguAnchor", () => {
  it("uses the chain's own point for the store's code or number", async () => {
    expect(await anchorWith([record({ code: "20350" })])).toEqual({
      lat: 45.49,
      lon: 18.09,
    });
    expect(await anchorWith([record({ codeSuffix: "0350" })])).toEqual({
      lat: 45.49,
      lon: 18.09,
    });
  });

  it("ignores a village point and a number two stores share", async () => {
    expect(
      await anchorWith([record({ codeSuffix: "0350", approximate: true })]),
    ).toBeNull();
    expect(
      await anchorWith([
        record({ codeSuffix: "0350" }),
        record({ codeSuffix: "0350", address: "Vukovarska 3" }, 45.6),
      ]),
    ).toBeNull();
  });

  it("asks no geocoder without a key", async () => {
    expect(await anchorWith([])).toBeNull();
  });
});
