import { describe, expect, it } from "vitest";

import { resolveMapOrigin } from "@/app/[locale]/map/utils/map-origin";

const ZAGREB = { lat: 45.81, lon: 15.98, city: "Zagreb" };
const SPLIT_GPS = { lat: 43.51, lon: 16.44, accuracy: 30 };

describe("resolveMapOrigin", () => {
  it("prefers GPS over the IP guess and shows distances", () => {
    expect(resolveMapOrigin(SPLIT_GPS, ZAGREB, false)).toMatchObject({
      origin: { lat: 43.51, lon: 16.44 },
      showDistances: true,
    });
  });

  it("hides distances for a coarse GPS fix", () => {
    const coarse = { ...SPLIT_GPS, accuracy: 3_000 };

    expect(resolveMapOrigin(coarse, null, false).showDistances).toBe(false);
  });

  it("sorts from the IP guess without distances when there is no GPS", () => {
    expect(resolveMapOrigin(null, ZAGREB, false)).toEqual({
      origin: { lat: 45.81, lon: 15.98 },
      showDistances: false,
    });
  });

  it("lets a pinned place beat the IP guess", () => {
    expect(resolveMapOrigin(null, ZAGREB, true).origin).toBeNull();
  });
});
