import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";
import ProductDetailClient from "@/features/products/detail/components/product-detail-client";
import ProductJsonLd from "@/features/products/detail/components/product-json-ld";
import { productBreadcrumbSteps } from "@/app/[locale]/products/[id]/utils/product-breadcrumbs";
import { categoryName } from "@/app/[locale]/categories/utils/category-names";
import PageBreadcrumbs from "@/components/custom/common/display/page-breadcrumbs";
import SimilarProducts from "@/features/products/detail/components/similar-products";
import { similarProducts } from "@/app/[locale]/products/[id]/utils/similar-products";
import {
  OPTIONAL_LOOKUP_TIMEOUT_MS,
  getCategoryProducts,
  getProductCategorySlug,
} from "@/lib/api/catalog-categories/server";
import type { CategoryProduct } from "@/lib/api/types";
import { productMetadata } from "@/app/[locale]/products/[id]/utils/product-metadata";
import {
  getVerifiedMainPhotoUrl,
  getVerifiedProductImages,
} from "@/lib/api/product-images/server";
import { productCacheState } from "@/app/[locale]/products/[id]/utils/product-cache-state";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { getServerProductPrices } from "@/lib/cijene-api/server/get-product-prices";
import { formatPrice } from "@/utils/price/price";
import { getMinPrice } from "@/utils/price/product-price-utils";
import { productPageUrl } from "@/utils/links/product-links";
import { decodeProductId } from "@/utils/links/product-id";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";

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

  // The page answers an outage with a 5xx, so this title only names the error page's tab.
  if (result.status === "unavailable") {
    return {
      title: t("meta.title"),
      // Next merges metadata shallowly, so leaving alternates out would keep the layout's self canonical.
      alternates: { canonical: null },
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

/** Names and brands only, from the backend: linking similar products must not spend upstream price quota. */
async function categoryNeighbours(
  categorySlug: string | null,
): Promise<CategoryProduct[]> {
  if (!categorySlug) return [];

  try {
    const page = await getCategoryProducts(
      categorySlug,
      1,
      OPTIONAL_LOOKUP_TIMEOUT_MS,
    );

    return page?.items ?? [];
  } catch (error) {
    console.warn("[catalog] similar products lookup failed", error);

    return [];
  }
}

export default async function ProductDetailsPage(
  props: PageProps<"/[locale]/products/[id]">,
) {
  // The client keeps the raw segment it always had; only server lookups and URLs decode it.
  const { id: rawId } = await props.params;
  const ean = decodeProductId(rawId);
  // Read once here, so the server HTML and the hydrating client agree on "today" even across midnight.
  const today = zagrebClock(new Date()).date;
  const result = await getServerProduct(ean);

  // No loading.tsx sits above this page, so nothing has streamed yet and the 404 status holds.
  if (result.status === "missing") notFound();

  // Crawlers read a 5xx as temporary and retry, while a 200 shell or a noindex could drop a real product.
  if (result.status === "unavailable") {
    throw new Error(`Price API unavailable for product ${ean}`);
  }

  const { product } = result;
  const locale = await getLocale();
  // Awaited rather than streamed, so crawlers without JavaScript find the product, its photo and its prices in <main>.
  const [photos, prices, photoUrl, categorySlug] = await Promise.all([
    getVerifiedProductImages(product.ean),
    getServerProductPrices(ean),
    getVerifiedMainPhotoUrl(product.ean),
    getProductCategorySlug(product.ean),
  ]);
  const similar = similarProducts(
    await categoryNeighbours(categorySlug),
    product.ean,
  );

  const [t, tShell, tProduct] = await Promise.all([
    getTranslations("categories"),
    getTranslations("shell"),
    getTranslations("productDetail"),
  ]);
  const breadcrumbSteps = productBreadcrumbSteps({
    ean: product.ean,
    productName: product.name || product.ean,
    homeLabel: t("breadcrumbs.home"),
    productsLabel: tShell("nav.products"),
    category: categorySlug
      ? { slug: categorySlug, name: categoryName(t, categorySlug) }
      : null,
  });
  const similarHeading = tProduct("similarProducts.heading");

  return (
    <div className="space-y-4">
      <PageBreadcrumbs
        label={t("breadcrumbs.label")}
        steps={breadcrumbSteps}
        locale={locale}
      />

      <ProductJsonLd
        product={product}
        url={productPageUrl(product.ean, locale)}
        image={photoUrl}
      />

      <HydrationBoundary
        state={productCacheState(
          rawId,
          { data: product, fetchedAt: result.fetchedAt },
          prices,
          photos,
        )}
      >
        <ProductDetailClient ean={rawId} today={today} />
      </HydrationBoundary>

      {similar.length > 0 && (
        <SimilarProducts heading={similarHeading} products={similar} />
      )}
    </div>
  );
}
