import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import LandingJsonLd from "@/app/[locale]/(root)/components/json-ld";
import { productJsonLd } from "@/app/[locale]/products/[id]/utils/product-json-ld";
import { breadcrumbStepsJsonLd } from "@/utils/breadcrumb-json-ld";
import { chain, product } from "@/test/price-fixtures";

vi.mock("next-intl/server", () => ({
  getLocale: async () => "hr",
  getTranslations: async () => (key: string) => key,
}));

// Google shows these only when they are true; we sell nothing and hold no stock or reviews.
const UNBACKED_KEYS = [
  "availability",
  "priceValidUntil",
  "aggregateRating",
  "review",
];

/** Every place a JSON-LD value is empty, unbacked or priced in anything but euros. */
function structuredDataProblems(value: unknown, path = "$"): string[] {
  if (value === null || value === undefined || value === "") {
    return [`${path} is empty`];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${path} is an empty list`];

    return value.flatMap((item, index) =>
      structuredDataProblems(item, `${path}[${index}]`),
    );
  }

  if (typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = `${path}.${key}`;

    if (UNBACKED_KEYS.includes(key)) return [`${childPath} is not backed`];
    if (key === "priceCurrency" && child !== "EUR") {
      return [`${childPath} is ${String(child)}`];
    }

    return structuredDataProblems(child, childPath);
  });
}

describe("structured data", () => {
  it("describes a priced product with no empty or unbacked values", () => {
    const markup = productJsonLd({
      product: product(
        [chain("konzum", "0.89", "1.19"), chain("spar", "0.30", "1.35")],
        { ean: "5449000000996", brand: "Coca-Cola", name: "Coca-Cola" },
      ),
      url: "https://disscount.me/products/5449000000996",
      image: "https://disscount.me/photo.jpg",
    });

    expect(structuredDataProblems(markup)).toEqual([]);
  });

  it("leaves fields out, rather than empty, for a product with no data", () => {
    const markup = productJsonLd({
      product: product([], { ean: "123", brand: null, name: "" }),
      url: "https://disscount.me/products/123",
      image: null,
    });

    expect(structuredDataProblems(markup)).toEqual([]);
  });

  it("gives a breadcrumb trail absolute URLs and no empty names", () => {
    const markup = breadcrumbStepsJsonLd(
      [
        { label: "Početna", path: "/" },
        { label: "Kategorije", path: "/categories" },
        { label: "Mlijeko", path: "/categories/mlijeko" },
      ],
      "hr",
    );

    expect(structuredDataProblems(markup)).toEqual([]);
    expect(
      markup.itemListElement.every((item) => item.item.startsWith("http")),
    ).toBe(true);
  });

  it("names the site by brand and domain, never as Discount", async () => {
    const element = (await LandingJsonLd()) as ReactElement<{
      data: { "@graph": Record<string, unknown>[] };
    }>;
    const graph = element.props.data["@graph"];
    const website = graph.find((node) => node["@type"] === "WebSite");

    expect(structuredDataProblems(element.props.data)).toEqual([]);
    expect(website).toMatchObject({
      name: "Disscount",
      alternateName: "disscount.me",
    });
    expect(JSON.stringify(graph)).not.toMatch(/"Discount"/);
  });
});
