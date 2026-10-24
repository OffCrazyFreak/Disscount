import { describe, expect, it } from "vitest";

import { withoutSharedPoints } from "@/lib/store-locations/sync/shared-points";

describe("withoutSharedPoints", () => {
  it("drops records that share a point with another address", () => {
    const a = { address: "Ivana Brnjika Slovaka 105", lat: 45.56, lon: 18.18 };
    const b = { address: "Ivana Brnjika Slovaka 37", lat: 45.56, lon: 18.18 };
    const c = { address: "Josipovo 69", lat: 45.77, lon: 17.69 };

    expect(withoutSharedPoints([a, b, c])).toEqual([c]);
  });

  it("keeps one address spelled two ways", () => {
    const a = { address: "Trg Ante Starčevića 10", lat: 45.68, lon: 18.4 };
    const b = { address: "Trg A. Starčevića 10", lat: 45.68, lon: 18.4 };

    expect(withoutSharedPoints([a, b])).toEqual([a, b]);
  });
});
