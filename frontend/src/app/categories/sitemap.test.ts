import { describe, expect, it, vi } from "vitest";

import sitemap from "@/app/categories/sitemap";
import { getCatalogCategories } from "@/lib/api/catalog-categories/server";
import { appUrl } from "@/lib/env";

vi.mock("server-only", () => ({}));

vi.mock("next/server", () => ({ connection: async () => {} }));

vi.mock("@/lib/api/catalog-categories/server", () => ({
  getCatalogCategories: vi.fn(),
}));

describe("category sitemap", () => {
  it("lists the index and the indexable hubs with products, in Croatian only", async () => {
    vi.mocked(getCatalogCategories).mockResolvedValue({
      departments: [],
      categories: [
        {
          slug: "mlijeko",
          department: "hrana",
          indexable: true,
          productCount: 9,
        },
        { slug: "vino", department: "pice", indexable: false, productCount: 4 },
        { slug: "jaja", department: "hrana", indexable: true, productCount: 0 },
      ],
    });

    expect(await sitemap()).toEqual([
      { url: `${appUrl()}/categories` },
      { url: `${appUrl()}/categories/mlijeko` },
    ]);
  });
});
