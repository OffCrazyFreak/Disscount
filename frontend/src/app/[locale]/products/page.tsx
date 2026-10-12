import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ProductsClient from "@/app/[locale]/products/components/products-client";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { readSearchParam } from "@/utils/generic";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("products");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/products", locale),
  };
}

export default async function ProductsPage(
  props: PageProps<"/[locale]/products">,
) {
  const query = readSearchParam(await props.searchParams);

  // ProductsClient's useSearchParams needs a Suspense boundary when prerendering.
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SearchBarSkeleton />
          <div className="flex items-center justify-center py-12">
            <BlockLoadingSpinner />
          </div>
        </div>
      }
    >
      <ProductsClient query={query} />
    </Suspense>
  );
}
