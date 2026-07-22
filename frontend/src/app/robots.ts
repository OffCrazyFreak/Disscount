import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

const baseUrl = appUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/shopping-lists",
        "/watchlist",
        "/digital-cards",
        "/spending",
        "/reset-password",
        "/offline",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
