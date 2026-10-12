import { describe, expect, it } from "vitest";

import { needsJpegFallback } from "@/utils/browser/card-image";

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
