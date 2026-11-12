import { describe, expect, it } from "vitest";

import { pickNearAnchor } from "@/lib/store-locations/dgu/near-anchor";

describe("pickNearAnchor", () => {
  const zagreb = { lat: 45.8, lon: 15.97 };
  const split = { lat: 43.51, lon: 16.44 };

  it("takes the one place near the store's independent point", () => {
    expect(
      pickNearAnchor([zagreb, split], { lat: 45.8005, lon: 15.97 }),
    ).toEqual(zagreb);
  });

  it("takes the nearest of several close places", () => {
    const nextDoor = { lat: 45.8009, lon: 15.97 };

    expect(pickNearAnchor([nextDoor, zagreb], zagreb)).toEqual(zagreb);
  });

  it("refuses when no place is near", () => {
    expect(pickNearAnchor([zagreb, split], { lat: 44.5, lon: 16 })).toBeNull();
  });
});
