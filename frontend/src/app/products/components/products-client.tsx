"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";
import ProductFiltersBar from "@/app/products/components/product-filters-bar";
import ProductResults from "@/app/products/components/product-results";
import useInfiniteProducts from "@/app/products/hooks/use-infinite-products";
import useProductFilters from "@/app/products/hooks/use-product-filters";
import useSeedPreferredFilters from "@/app/products/hooks/use-seed-preferred-filters";

interface IProductsClientProps {
  query: string;
}

export default function ProductsClient({ query }: IProductsClientProps) {
  const pathname = usePathname();

  // The page owns the one write of the user's pinned stores into the URL, so
  // any number of readers elsewhere can mount without racing it.
  useSeedPreferredFilters();

  const filters = useProductFilters();
  const {
    selectedCategories,
    selectedBrands,
    allowedChains,
    locationsReady,
    activeFilterCount,
    clearFilters,
  } = filters;

  const { visibleProducts, total, isTruncated, isLoading, error } =
    useInfiniteProducts(query, {
      allowedChains,
      selectedCategories,
      selectedBrands,
    });

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton />}>
        <SearchBar
          placeholder="Pretraži proizvode..."
          searchRoute={pathname}
          allowScanning
        />
      </Suspense>

      <ProductFiltersBar filters={filters} query={query} />

      <ProductResults
        query={query}
        products={visibleProducts}
        total={total}
        isTruncated={isTruncated}
        // A location filter is set, but the city to chains mapping is still loading
        isLoading={isLoading || (Boolean(query) && !locationsReady)}
        error={error}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      <BackToTopButton containerClassName="hidden md:block" />
    </div>
  );
}
