import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/seo/share-metadata";
import { Suspense } from "react";
import ProductsClient from "@/features/products/components/products-client";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import BlockLoadingSpinner from "@/components/custom/common/feedback/block-loading-spinner";
import { readSearchParam } from "@/utils/format/generic";
import { pageMetadata } from "@/i18n/alternates";

export async function generateMetadata(
  _props: PageProps<"/[locale]/products">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return withSharePreview(await pageMetadata("products", "/products"), parent);
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
