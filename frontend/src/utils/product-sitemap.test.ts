import { describe, expect, it } from "vitest";
import { PRODUCT_SITEMAP_IDS, productSitemapId } from "@/utils/product-sitemap";

describe("productSitemapId", () => {
  it("always files an EAN under the same sitemap", () => {
    expect(productSitemapId("5449000000996")).toBe(
      productSitemapId("5449000000996"),
    );
  });

  it("spreads EANs over every file", () => {
    const counts = new Map<number, number>();

    for (let i = 0; i < 8_000; i += 1) {
      const id = productSitemapId(String(3850000000000 + i * 7));
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    expect([...counts.keys()].sort()).toEqual(PRODUCT_SITEMAP_IDS);

    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(1_300);
    }
  });
});
