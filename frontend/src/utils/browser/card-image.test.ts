import { describe, expect, it } from "vitest";

import {
  firstWithinLimit,
  needsJpegFallback,
} from "@/utils/browser/card-image";

describe("needsJpegFallback", () => {
  it("keeps a real WebP blob", () => {
    expect(needsJpegFallback(new Blob(["x"], { type: "image/webp" }))).toBe(
      false,
    );
  });

  it("falls back when the browser returned PNG", () => {
    expect(needsJpegFallback(new Blob(["x"], { type: "image/png" }))).toBe(
      true,
    );
  });

  it("falls back when the blob has no type or is missing", () => {
    expect(needsJpegFallback(new Blob(["x"]))).toBe(true);
    expect(needsJpegFallback(null)).toBe(true);
  });
});

describe("firstWithinLimit", () => {
  const attempts = [{ longEdge: 10 }, { longEdge: 5 }, { longEdge: 2 }];
  const sized = (bytes: number) => new Blob([new Uint8Array(bytes)]);

  it("stops at the first attempt that fits", async () => {
    const seen: number[] = [];
    const blob = await firstWithinLimit(
      attempts,
      async ({ longEdge }) => {
        seen.push(longEdge);
        return sized(longEdge * 10);
      },
      60,
    );

    expect(seen).toEqual([10, 5]);
    expect(blob?.size).toBe(50);
  });

  it("returns undefined when nothing fits", async () => {
    expect(
      await firstWithinLimit(attempts, async () => sized(100), 10),
    ).toBeUndefined();
  });
});
