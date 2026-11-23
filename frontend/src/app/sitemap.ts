import type { MetadataRoute } from "next";
import { templatePosts } from "@/app/[locale]/updates/posts";
import { languageAlternates, localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";

// Each entry is the Croatian URL plus its hreflang set, so each language is discoverable without listing it five times.
function entry(
  href: string,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl(href, DEFAULT_LOCALE),
    alternates: { languages: languageAlternates(href) },
    ...(lastModified && { lastModified }),
  };
}

// The legal pages exist in Croatian only for now, so they get no hreflang set.
function croatianOnly(href: string): MetadataRoute.Sitemap[number] {
  return { url: localizedUrl(href, DEFAULT_LOCALE) };
}

// Statistics stays out until its server HTML has more than a heading; Google ignores priority and change frequency.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/"),
    entry("/products"),
    entry("/updates"),
    entry("/suggestions"),
    entry("/map"),
    croatianOnly("/privacy-policy"),
    croatianOnly("/terms-of-service"),
    croatianOnly("/data-deletion"),
  ];

  const postRoutes: MetadataRoute.Sitemap = templatePosts.map((post) =>
    entry(`/updates/${post.id}`, new Date(post.date)),
  );

  return [...staticRoutes, ...postRoutes];
}
