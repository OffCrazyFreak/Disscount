import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getListedEans } from "@/lib/api/product-images/server";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { productPageUrl } from "@/utils/product-links";
import { PRODUCT_SITEMAP_IDS, productSitemapId } from "@/utils/product-sitemap";

export function generateSitemaps() {
  return PRODUCT_SITEMAP_IDS.map((id) => ({ id }));
}

/** Croatian URLs only, since translations are noindex; no lastmod, because the catalogue has no honest date and Google ignores one it cannot trust. */
export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  // The backend is not reachable while the Docker image builds, so this renders per request.
  await connection();
  const id = Number(await props.id);
  const eans = await getListedEans();

  return eans
    .filter((ean) => productSitemapId(ean) === id)
    .map((ean) => ({ url: productPageUrl(ean, DEFAULT_LOCALE) }));
}
