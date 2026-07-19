"use client";

import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/common/no-results";
import useInfiniteProducts from "@/app/products/hooks/use-infinite-products";
import useProductFilters from "@/app/products/hooks/use-product-filters";
import ProductFiltersBar from "@/app/products/components/product-filters-bar";
import ProductItem from "@/app/products/components/product-item/product-item";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import PageFab from "@/components/custom/fab/page-fab";

export default function ProductsClient({ query }: { query: string }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [viewMode] = useViewMode(pathname);

  const filters = useProductFilters();
  const {
    selectedCategories,
    selectedBrands,
    allowedChains,
    locationsReady,
    activeFilterCount,
    clearFilters,
  } = filters;

  const { visibleProducts, total, isLoading, error } =
    useInfiniteProducts(query, {
      allowedChains,
      selectedCategories,
      selectedBrands,
    });

  // A location filter is set but the city -> chains mapping is still loading
  const waitingForLocations = Boolean(query) && !locationsReady;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton />}>
        <SearchBar
          placeholder="Pretraži proizvode..."
          searchRoute={pathname}
          clearable={true}
          allowScanning={true}
        />
      </Suspense>

      <ProductFiltersBar filters={filters} query={query} />

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0 &&
            `Rezultati pretrage za "${query}"${
              isLoading || waitingForLocations
                ? ""
                : ` (${total}${total >= 100 ? "+" : ""})`
            }`}
        </h3>

        {/* <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} /> */}
      </div>

      {isLoading || waitingForLocations ? (
        <div className="flex items-center justify-center py-12">
          <BlockLoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Search className="size-12 text-red-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Greška pri pretraživanju
          </h3>
          <p className="text-gray-600 mb-6">
            Došlo je do greške pri dohvaćanju podataka. Pokušajte ponovo.
          </p>
        </div>
      ) : query && total === 0 && activeFilterCount > 0 ? (
        <div>
          <NoResults
            icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
            description="Nema rezultata za odabrane filtere"
          />
          <div className="text-center">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Očisti filtere
            </Button>
          </div>
        </div>
      ) : query && total === 0 ? (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      ) : query ? (
        <>
          <div
            className={`${
              viewMode !== "grid" || isMobile
                ? "space-y-4"
                : "grid grid-cols-2 sm:grid-cols-3 gap-4"
            }`}
          >
            {visibleProducts.map((product) => (
              <div
                key={product.ean}
                className={`${
                  viewMode !== "grid" || isMobile ? "w-full" : "w-76"
                }`}
              >
                <ProductItem product={product} viewMode={viewMode} />
              </div>
            ))}
          </div>

          <PageFab />
        </>
      ) : activeFilterCount > 0 ? (
        <div className="text-center py-12">
          <SlidersHorizontal className="size-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unesite pojam za pretragu
          </h3>
          <p className="text-gray-600 mb-6">
            Filteri su postavljeni, rezultati će se prikazati nakon pretrage
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="size-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Počnite pretraživanje
          </h3>
          <p className="text-gray-600 mb-6">
            Unesite naziv proizvoda koji tražite
          </p>
        </div>
      )}
    </div>
  );
}
