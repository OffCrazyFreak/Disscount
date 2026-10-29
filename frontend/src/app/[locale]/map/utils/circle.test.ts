import { describe, expect, it } from "vitest";

import { circleBounds, circlePolygon } from "@/app/[locale]/map/utils/circle";
import { distanceKm } from "@/app/[locale]/map/utils/distance";

const RIJEKA = { lat: 45.33, lon: 14.44 };

describe("circle", () => {
  it("spans the radius on every side", () => {
    const [[west, south], [east, north]] = circleBounds(RIJEKA, 10_000);

    expect(distanceKm(RIJEKA, { lat: north, lon: RIJEKA.lon })).toBeCloseTo(
      10,
      1,
    );
    expect(distanceKm(RIJEKA, { lat: south, lon: RIJEKA.lon })).toBeCloseTo(
      10,
      1,
    );
    expect(distanceKm(RIJEKA, { lat: RIJEKA.lat, lon: east })).toBeCloseTo(
      10,
      1,
    );
    expect(distanceKm(RIJEKA, { lat: RIJEKA.lat, lon: west })).toBeCloseTo(
      10,
      1,
    );
  });

  it("draws a closed ring at the radius", () => {
    const ring = circlePolygon(RIJEKA, 10_000).geometry.coordinates[0];

    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const [lon, lat] of ring) {
      expect(distanceKm(RIJEKA, { lat, lon })).toBeCloseTo(10, 0);
    }
  });
});
