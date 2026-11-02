import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import ProductDetailClient from "@/app/[locale]/products/[id]/components/product-detail-client";
import ProductJsonLd from "@/app/[locale]/products/[id]/components/product-json-ld";
import { productMetadata } from "@/app/[locale]/products/[id]/utils/product-metadata";
import { getMainPhotoUrl } from "@/lib/api/product-images/server";
import {
  getServerProduct,
  type ServerProductResult,
} from "@/lib/cijene-api/server/get-product";
import { productByEanQueryKey } from "@/lib/cijene-api/query-hooks";
import { BRAND_OG_IMAGE_ID } from "@/app/og/localized-og";
import { appUrl } from "@/lib/env";
import { localePath } from "@/i18n/locale-path";
import { formatPrice } from "@/utils/price";
import { getMinPrice } from "@/utils/product-price-utils";
import { productPageUrl } from "@/utils/product-links";
import { decodeProductId } from "@/utils/product-id";

const MISSING: ServerProductResult = { status: "missing" };

export async function generateMetadata(
  props: PageProps<"/[locale]/products/[id]">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = decodeProductId((await props.params).id);
  const locale = await getLocale();
  const t = await getTranslations("productDetail");
  const result = id === null ? MISSING : await getServerProduct(id);

  if (id === null || result.status === "missing") {
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
    };
  }

  const { product } = result;
  const name = product.name || product.ean;
  const lowPrice = getMinPrice(product);

  return productMetadata({
    ean: id,
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
    photoUrl: await getMainPhotoUrl(id),
    parent: await parent,
  });
}

export default async function ProductDetailsPage(
  props: PageProps<"/[locale]/products/[id]">,
) {
  // The client keeps the raw segment it always had; only server lookups and URLs decode it.
  const { id: rawId } = await props.params;
  const ean = decodeProductId(rawId);
  const result = ean === null ? MISSING : await getServerProduct(ean);

  // loading.tsx has already streamed a 200, so Next marks this noindex instead.
  if (ean === null || result.status === "missing") notFound();

  if (result.status === "unavailable") {
    return <ProductDetailClient ean={rawId} />;
  }

  const locale = await getLocale();
  const photoUrl = await getMainPhotoUrl(ean);

  // Seeds the query the client reads, so the first HTML already holds the product.
  const queryClient = new QueryClient();
  queryClient.setQueryData(productByEanQueryKey(rawId), result.product);

  return (
    <>
      <ProductJsonLd
        product={result.product}
        url={productPageUrl(ean, locale)}
        image={
          photoUrl ??
          `${appUrl()}${localePath(locale, `/opengraph-image/${BRAND_OG_IMAGE_ID}`)}`
        }
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductDetailClient ean={rawId} />
      </HydrationBoundary>
    </>
  );
}
