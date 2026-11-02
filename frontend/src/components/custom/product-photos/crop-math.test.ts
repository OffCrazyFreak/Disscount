import { describe, expect, it } from "vitest";

import {
  toPercent,
  toPixels,
} from "@/components/custom/product-photos/crop-math";

describe("crop math", () => {
  it("sends a near-full frame as no crop at all", () => {
    expect(
      toPixels({ unit: "%", x: 0, y: 0, width: 100, height: 99.8 }, 4800, 1794),
    ).toBeNull();
  });

  it("converts to pixels of the rotated original and back", () => {
    const pixels = toPixels(
      { unit: "%", x: 10, y: 20, width: 50, height: 25 },
      1000,
      400,
    );

    expect(pixels).toEqual({ x: 100, y: 80, width: 500, height: 100 });
    expect(toPercent(pixels!, 1000, 400)).toEqual({
      unit: "%",
      x: 10,
      y: 20,
      width: 50,
      height: 25,
    });
  });

  it("keeps the frame inside the photo and at least as large as the server accepts", () => {
    const pixels = toPixels(
      { unit: "%", x: 99.9, y: 0, width: 0.1, height: 50 },
      1000,
      400,
    );

    expect(pixels!.x + pixels!.width).toBeLessThanOrEqual(1000);
    expect(pixels!.width).toBeGreaterThanOrEqual(16);
  });
});
