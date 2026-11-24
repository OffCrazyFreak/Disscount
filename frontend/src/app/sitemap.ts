import type { MetadataRoute } from "next";
import { connection } from "next/server";
import {
  hasChainContent,
  storeCountsByChain,
} from "@/app/[locale]/chains/utils/chain-stores";
import { templatePosts } from "@/app/[locale]/updates/posts";
import { languageAlternates, localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { getServerChainStats } from "@/lib/cijene-api/server/get-chain-stats";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";
import {
  CHAINS_PATH,
  MAPPED_CHAIN_CODES,
  chainPath,
} from "@/utils/links/chain-links";

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

// The legal pages exist in Croatian only for now, and only Croatian hubs are indexed, so these get no hreflang set.
function croatianOnly(href: string): MetadataRoute.Sitemap[number] {
  return { url: localizedUrl(href, DEFAULT_LOCALE) };
}

/** The hubs the chain page lets be indexed; every mapped chain when the store directory cannot be read. */
async function indexableChainCodes(): Promise<string[]> {
  try {
    const [stats, directory] = await Promise.all([
      getServerChainStats(),
      getStoreDirectory(),
    ]);
    const storeCounts = storeCountsByChain(directory.stores);

    return MAPPED_CHAIN_CODES.filter((code) =>
      hasChainContent(storeCounts.get(code) ?? 0, stats, code),
    );
  } catch (error) {
    console.warn("[sitemap] store directory unavailable", error);

    return MAPPED_CHAIN_CODES;
  }
}

// Statistics stays out until its server HTML has more than a heading; Google ignores priority and change frequency.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The store database and upstream are not reachable while the Docker image builds, so this renders per request.
  await connection();

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

  const chainRoutes: MetadataRoute.Sitemap = [
    croatianOnly(CHAINS_PATH),
    ...(await indexableChainCodes()).map((code) =>
      croatianOnly(chainPath(code)),
    ),
  ];

  return [...staticRoutes, ...postRoutes, ...chainRoutes];
}
