import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { PROTECTED_ROUTE_PREFIXES } from "@/constants/protected-routes";

const baseUrl = appUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PROTECTED_ROUTE_PREFIXES,
        "/api/",
        "/reset-password",
        "/offline",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
