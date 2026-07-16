import { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "@/app/products/components/products-client";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";

export const metadata: Metadata = {
  title: "Proizvodi",
  description: "Pregled dostupnih proizvoda.",
};

interface IPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ProductsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  let query = rawQuery;

  try {
    query = decodeURIComponent(rawQuery) || rawQuery;
  } catch {
    query = rawQuery;
  }

  // ProductsClient reads filter params via useSearchParams, which requires a
  // Suspense boundary during prerendering.
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
