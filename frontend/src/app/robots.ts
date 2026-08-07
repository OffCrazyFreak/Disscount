import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { PROTECTED_ROUTE_PREFIXES } from "@/constants/protected-routes";

const baseUrl = appUrl();

/**
 * Not simply PROTECTED_ROUTE_PREFIXES any more, because "bounce the user home on logout"
 * and "tell a crawler to stay away" stopped being the same question.
 *
 * A shopping list is shared by its own URL, so `/shopping-lists/<id>` is a link people
 * paste around and a crawler may well meet. Disallowing it would be counterproductive: a
 * disallowed URL is never fetched, so the crawler never reads the `noindex` header that
 * actually keeps it out of the index. The header in next.config.ts is the right tool, and
 * it covers the whole prefix.
 */
const CRAWLER_DISALLOWED = PROTECTED_ROUTE_PREFIXES.filter(
  (prefix) => prefix !== "/shopping-lists",
);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...CRAWLER_DISALLOWED, "/api/", "/reset-password", "/offline"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
