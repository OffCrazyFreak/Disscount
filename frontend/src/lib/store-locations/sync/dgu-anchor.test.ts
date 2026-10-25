import { describe, expect, it, vi } from "vitest";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type { ILocatorStore } from "@/lib/store-locations/types";

vi.mock("server-only", () => ({}));

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

function upstreamStore(code: string): StoreResponse {
  return { chain_code: "ntl", code } as StoreResponse;
}

function anchorWith(
  records: ILocatorStore[],
  codes = ["20350"],
  store = target,
) {
  return createDguAnchor(
    new Map([["ntl", records]]),
    codes.map(upstreamStore),
    new AbortController().signal,
  )(store);
}

describe("createDguAnchor", () => {
  it("uses the chain's own point for the store's number", async () => {
    expect(await anchorWith([record({ codeSuffix: "0350" })])).toMatchObject({
      lat: 45.49,
      lon: 18.09,
    });
  });

  it("refuses a number another upstream code also ends in", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "");

    expect(
      await anchorWith([record({ codeSuffix: "0350" })], ["20350", "30350"]),
    ).toBeNull();
  });

  it("lets a village point contest a number but never place it", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "");

    expect(
      await anchorWith([record({ codeSuffix: "0350", approximate: true })]),
    ).toBeNull();
    expect(
      await anchorWith([
        record({ codeSuffix: "0350" }),
        record({ codeSuffix: "0350", approximate: true }, 45.6),
      ]),
    ).toBeNull();
  });

  it("asks Geoapify nothing without a key or after a recent miss", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    vi.stubEnv("GEOAPIFY_API_KEY", "");
    expect(await anchorWith([])).toBeNull();

    vi.stubEnv("GEOAPIFY_API_KEY", "test");
    expect(
      await anchorWith([], ["20350"], { ...target, skipGeoapify: true }),
    ).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
