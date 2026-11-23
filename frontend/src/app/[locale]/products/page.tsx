import { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "@/features/products/components/products-client";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import BlockLoadingSpinner from "@/components/custom/common/feedback/block-loading-spinner";
import { readSearchParam } from "@/utils/format/generic";
import { pageMetadata } from "@/i18n/alternates";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("products", "/products");
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
