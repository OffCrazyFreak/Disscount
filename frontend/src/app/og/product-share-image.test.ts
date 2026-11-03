import { describe, expect, it } from "vitest";
import {
  productShareImageFile,
  productShareImagePath,
} from "@/app/og/product-share-image";

describe("product share image URL", () => {
  it("stays the same for the same photo", () => {
    expect(productShareImageFile("https://images.test/a.jpg")).toBe(
      productShareImageFile("https://images.test/a.jpg"),
    );
  });

  it("changes with the photo", () => {
    expect(productShareImageFile("https://images.test/a.jpg")).not.toBe(
      productShareImageFile("https://images.test/b.jpg"),
    );
  });

  it("ends in .jpg so the proxy skips it and Cloudflare caches it", () => {
    expect(
      productShareImagePath("5449000000996", "https://images.test/a.jpg"),
    ).toMatch(/^\/og\/products\/5449000000996\/[0-9a-f]{16}\.jpg$/);
  });
});
