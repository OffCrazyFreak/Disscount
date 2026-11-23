import { describe, expect, it } from "vitest";

import { categoryPageUrl, categoryPath } from "@/utils/links/category-links";
import { appUrl } from "@/lib/env";

describe("categoryPath", () => {
  it("leaves the page out on page 1", () => {
    expect(categoryPath("mlijeko")).toBe("/categories/mlijeko");
    expect(categoryPath("mlijeko", 1)).toBe("/categories/mlijeko");
  });

  it("keeps later pages in the query", () => {
    expect(categoryPath("mlijeko", 3)).toBe("/categories/mlijeko?page=3");
  });
});

describe("categoryPageUrl", () => {
  it("prefixes translated locales and keeps the page", () => {
    expect(categoryPageUrl("mlijeko", "en", 2)).toBe(
      `${appUrl()}/en/categories/mlijeko?page=2`,
    );
  });
});
