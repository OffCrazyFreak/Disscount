import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
