import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";
import ProductDetailClient from "@/app/[locale]/products/[id]/components/product-detail-client";
import ProductJsonLd from "@/app/[locale]/products/[id]/components/product-json-ld";
import {
  productMetadata,
  translatedProductRobots,
} from "@/app/[locale]/products/[id]/utils/product-metadata";
import { getVerifiedMainPhotoUrl } from "@/lib/api/product-images/server";
import { productCacheState } from "@/app/[locale]/products/[id]/utils/product-cache-state";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { getServerProductPrices } from "@/lib/cijene-api/server/get-product-prices";
import { BRAND_OG_IMAGE_ID } from "@/app/og/localized-og";
import { appUrl } from "@/lib/env";
import { localePath } from "@/i18n/locale-path";
import { formatPrice } from "@/utils/price";
import { getMinPrice } from "@/utils/product-price-utils";
import { productPageUrl } from "@/utils/product-links";
import { decodeProductId } from "@/utils/product-id";

export async function generateMetadata(
  props: PageProps<"/[locale]/products/[id]">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = decodeProductId((await props.params).id);
  const locale = await getLocale();
  const t = await getTranslations("productDetail");
  const result = await getServerProduct(id);

  if (result.status === "missing") {
    return {
      title: t("notFound.title"),
      robots: { index: false, follow: false },
    };
  }

  // Upstream is down: keep the generic page metadata rather than mark a real product noindex.
  if (result.status === "unavailable") {
    return {
      title: t("meta.title"),
      description: t("meta.description"),
      alternates: { canonical: productPageUrl(id, locale) },
      ...translatedProductRobots(locale),
    };
  }

  const { product } = result;
  const name = product.name || product.ean;
  const lowPrice = getMinPrice(product);

  // Upstream strips leading zeros, so its EAN is the one canonical form of the URL.
  return productMetadata({
    ean: product.ean,
    locale,
    title: t("meta.productTitle", { name }),
    description:
      lowPrice === null
        ? t("meta.description")
        : t("meta.productDescription", {
            name,
            chains: product.chains.length,
            price: formatPrice(lowPrice, locale),
          }),
    photoUrl: await getVerifiedMainPhotoUrl(product.ean),
    parent: await parent,
  });
}

export default async function ProductDetailsPage(
  props: PageProps<"/[locale]/products/[id]">,
) {
  // The client keeps the raw segment it always had; only server lookups and URLs decode it.
  const { id: rawId } = await props.params;
  const ean = decodeProductId(rawId);
  const [result, prices] = await Promise.all([
    getServerProduct(ean),
    getServerProductPrices(ean),
  ]);

  // loading.tsx has already streamed a 200, so Next marks this noindex instead.
  if (result.status === "missing") notFound();

  if (result.status === "unavailable") {
    return <ProductDetailClient ean={rawId} />;
  }

  const { product } = result;
  const locale = await getLocale();
  const photoUrl = await getVerifiedMainPhotoUrl(product.ean);

  return (
    <>
      <ProductJsonLd
        product={product}
        url={productPageUrl(product.ean, locale)}
        image={
          photoUrl ??
          `${appUrl()}${localePath(locale, `/opengraph-image/${BRAND_OG_IMAGE_ID}`)}`
        }
      />

      <HydrationBoundary state={productCacheState(rawId, product, prices)}>
        <ProductDetailClient ean={rawId} />
      </HydrationBoundary>
    </>
  );
}
