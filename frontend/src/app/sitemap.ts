import type { MetadataRoute } from "next";
import { templatePosts } from "@/app/[locale]/updates/posts";
import { languageAlternates, localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";

// Every entry is the Croatian URL plus its hreflang set, so each language version
// is discoverable without listing it five times.
function entry(
  href: string,
  fields: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl(href, DEFAULT_LOCALE),
    alternates: { languages: languageAlternates(href) },
    ...fields,
  };
}

// The legal pages exist in Croatian only for now, so they get no hreflang set.
function croatianOnly(
  href: string,
  fields: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] {
  return { url: localizedUrl(href, DEFAULT_LOCALE), ...fields };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "weekly", priority: 1 }),
    entry("/products", { changeFrequency: "daily", priority: 0.9 }),
    entry("/updates", { changeFrequency: "weekly", priority: 0.6 }),
    entry("/suggestions", { changeFrequency: "weekly", priority: 0.5 }),
    entry("/map", { changeFrequency: "monthly", priority: 0.5 }),
    entry("/statistics", { changeFrequency: "monthly", priority: 0.5 }),
    croatianOnly("/privacy-policy", {
      changeFrequency: "yearly",
      priority: 0.2,
    }),
    croatianOnly("/terms-of-service", {
      changeFrequency: "yearly",
      priority: 0.2,
    }),
    croatianOnly("/data-deletion", {
      changeFrequency: "yearly",
      priority: 0.2,
    }),
  ];

  const postRoutes: MetadataRoute.Sitemap = templatePosts.map((post) =>
    entry(`/updates/${post.id}`, {
      lastModified: new Date(post.date),
      changeFrequency: "yearly",
      priority: 0.4,
    }),
  );

  return [...staticRoutes, ...postRoutes];
}
