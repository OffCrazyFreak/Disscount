import { describe, expect, it } from "vitest";

import { GET } from "@/app/sitemap-index.xml/route";
import { appUrl } from "@/lib/env";
import { PRODUCT_SITEMAP_IDS } from "@/utils/product-sitemap";

describe("GET /sitemap-index.xml", () => {
  it("lists the page and category sitemaps and every product file", async () => {
    const response = GET();
    const body = await response.text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, loc]) => loc,
    );

    expect(response.headers.get("content-type")).toBe("application/xml");
    expect(body).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(locs).toEqual([
      `${appUrl()}/sitemap.xml`,
      `${appUrl()}/categories/sitemap.xml`,
      ...PRODUCT_SITEMAP_IDS.map(
        (id) => `${appUrl()}/products/sitemap/${id}.xml`,
      ),
    ]);
  });
});
