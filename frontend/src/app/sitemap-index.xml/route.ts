import { appUrl } from "@/lib/env";
import { productSitemapUrls } from "@/utils/product-sitemap";

/** Next writes no index for generateSitemaps, and one URL covers every sitemap in Search Console and Bing. */
export function GET(): Response {
  const sitemaps = [
    `${appUrl()}/sitemap.xml`,
    `${appUrl()}/categories/sitemap.xml`,
    ...productSitemapUrls(),
  ]
    .map((url) => `  <sitemap><loc>${url}</loc></sitemap>`)
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
}
