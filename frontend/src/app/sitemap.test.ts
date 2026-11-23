import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { appUrl } from "@/lib/env";

describe("sitemap", () => {
  it("sends neither priority nor change frequency", () => {
    for (const entry of sitemap()) {
      expect(entry).not.toHaveProperty("priority");
      expect(entry).not.toHaveProperty("changeFrequency");
    }
  });

  it("dates only the update posts", () => {
    const dated = sitemap().filter((entry) => entry.lastModified);

    expect(dated.length).toBeGreaterThan(0);
    for (const entry of dated) expect(entry.url).toContain("/updates/");
  });

  it("leaves statistics out", () => {
    expect(sitemap().map((entry) => entry.url)).not.toContain(
      `${appUrl()}/statistics`,
    );
  });

  it("lets each language version list itself", () => {
    const products = sitemap().find(
      (entry) => entry.url === `${appUrl()}/products`,
    );

    expect(products?.alternates?.languages).toMatchObject({
      hr: `${appUrl()}/products`,
      en: `${appUrl()}/en/products`,
      "x-default": `${appUrl()}/products`,
    });
  });
});
