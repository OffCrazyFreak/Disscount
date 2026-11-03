import { describe, expect, it } from "vitest";

import { resolveMapOrigin } from "@/app/[locale]/map/utils/map-origin";

const ZAGREB = { lat: 45.81, lon: 15.98 };
const SPLIT = { lat: 43.5, lon: 16.45 };
const SPLIT_GPS = { lat: 43.51, lon: 16.44, accuracy: 30 };

describe("resolveMapOrigin", () => {
  it("prefers GPS over the IP guess and shows distances", () => {
    expect(resolveMapOrigin(SPLIT_GPS, null, null, ZAGREB)).toMatchObject({
      origin: { lat: 43.51, lon: 16.44 },
      showDistances: true,
    });
  });

  it("hides distances for a coarse GPS fix", () => {
    const coarse = { ...SPLIT_GPS, accuracy: 3_000 };

    expect(resolveMapOrigin(coarse, null, null, null).showDistances).toBe(
      false,
    );
  });

  it("sorts from the IP guess without distances when there is no GPS", () => {
    expect(resolveMapOrigin(null, null, null, ZAGREB)).toEqual({
      origin: { lat: 45.81, lon: 15.98 },
      showDistances: false,
    });
  });

  it("sorts from a picked or saved town before the IP guess", () => {
    expect(resolveMapOrigin(null, null, SPLIT, ZAGREB)).toEqual({
      origin: SPLIT,
      showDistances: false,
    });
  });

  it("lets the guess a near-me tap fell back to beat the town", () => {
    expect(resolveMapOrigin(null, ZAGREB, SPLIT, null).origin).toEqual(ZAGREB);
  });

  it("sorts alphabetically with nothing to start from", () => {
    expect(resolveMapOrigin(null, null, null, null).origin).toBeNull();
  });
});
