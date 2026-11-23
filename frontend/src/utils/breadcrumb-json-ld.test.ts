import { describe, expect, it } from "vitest";

import { breadcrumbListJsonLd } from "@/utils/breadcrumb-json-ld";

describe("breadcrumbListJsonLd", () => {
  it("numbers each crumb from 1 with its absolute URL", () => {
    expect(
      breadcrumbListJsonLd([
        { name: "Početna", url: "https://disscount.me/" },
        { name: "Mlijeko", url: "https://disscount.me/categories/mlijeko" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Početna",
          item: "https://disscount.me/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Mlijeko",
          item: "https://disscount.me/categories/mlijeko",
        },
      ],
    });
  });
});
