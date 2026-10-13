import { describe, expect, it } from "vitest";

import { matchLocatorStore } from "@/lib/store-locations/sync/match-locator-store";
import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

function target(city: string): ISyncTarget {
  return {
    chain: "konzum",
    code: "K1",
    address: "Obala 1",
    city,
    zipcode: null,
    skipGeoapify: false,
  };
}

const RABAC = { address: "Obala 1", city: "Rabac", lat: 45.08, lon: 14.15 };
const RAB = { address: "Obala 1", city: "Rab", lat: 44.76, lon: 14.76 };

describe("matchLocatorStore", () => {
  it("does not take a town whose name merely contains the target's", () => {
    expect(matchLocatorStore(target("Rab"), [RABAC])).toBeNull();
  });

  it("prefers the exact town over an earlier partial one", () => {
    expect(matchLocatorStore(target("Rab"), [RABAC, RAB])).toBe(RAB);
  });

  it("still accepts one town written as a district of another", () => {
    const dubrava = { ...RAB, city: "Zagreb - Dubrava" };

    expect(matchLocatorStore(target("Zagreb"), [dubrava])).toBe(dubrava);
  });
});
