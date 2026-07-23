import { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "@/app/products/components/products-client";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Proizvodi",
  description: "Pregled dostupnih proizvoda.",
};

export default async function ProductsPage(props: PageProps<"/products">) {
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
