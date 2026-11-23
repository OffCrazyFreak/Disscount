import { describe, expect, it } from "vitest";

import { appUrl } from "@/lib/env";
import {
  breadcrumbListJsonLd,
  breadcrumbStepsJsonLd,
} from "@/utils/breadcrumb-json-ld";

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

describe("breadcrumbStepsJsonLd", () => {
  it("turns each step's path into an absolute URL in the page's language", () => {
    const markup = breadcrumbStepsJsonLd(
      [
        { label: "Home", path: "/" },
        { label: "Milk", path: "/categories/mlijeko" },
      ],
      "en",
    );

    expect(markup.itemListElement.map((item) => item.item)).toEqual([
      `${appUrl()}/en`,
      `${appUrl()}/en/categories/mlijeko`,
    ]);
  });
});
