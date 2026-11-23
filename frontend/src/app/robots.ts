import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { PROTECTED_ROUTE_PREFIXES } from "@/constants/auth/protected-routes";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

const baseUrl = appUrl();

/** Crawlable because a disallowed URL is never fetched, hiding the `noindex` header in next.config.ts. */
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
    // The index names sitemap.xml, the category file and every product file, so they need no lines of their own.
    sitemap: `${baseUrl}/sitemap-index.xml`,
  };
}
