import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { PROTECTED_ROUTE_PREFIXES } from "@/constants/protected-routes";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { productSitemapUrls } from "@/utils/product-sitemap";

const baseUrl = appUrl();

/** Shared lists stay crawlable because a disallowed URL is never fetched, so a crawler would never read the `noindex` header in next.config.ts. */
const CRAWLER_DISALLOWED = PROTECTED_ROUTE_PREFIXES.filter(
  (prefix) => prefix !== "/shopping-lists",
);

const LOCALE_SEGMENTS = [
  "",
  ...LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((l) => `/${l}`),
];

function inEveryLocale(paths: string[]): string[] {
  return LOCALE_SEGMENTS.flatMap((segment) =>
    paths.map((path) => `${segment}${path}`),
  );
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...inEveryLocale([
          ...CRAWLER_DISALLOWED,
          "/reset-password",
          "/offline",
        ]),
        "/api/",
      ],
    },
    // Next writes no sitemap index for generateSitemaps, so each product file is listed here.
    sitemap: [`${baseUrl}/sitemap.xml`, ...productSitemapUrls()],
  };
}
