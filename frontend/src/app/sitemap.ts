import type { MetadataRoute } from "next";
import { templatePosts } from "@/app/updates/posts";
import { appUrl } from "@/lib/env";

const baseUrl = appUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/updates`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/suggestions`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/map`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/statistics`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/data-deletion`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = templatePosts.map((post) => ({
    url: `${baseUrl}/updates/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes];
}
