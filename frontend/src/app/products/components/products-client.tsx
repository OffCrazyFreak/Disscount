"use client";

import { usePathname } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import useInfiniteProducts from "@/app/products/hooks/useInfiniteProducts";
import { ProductItem } from "@/app/products/components/product-item/product-item";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import ViewSwitcher from "@/components/custom/view-switcher";
import SearchBar from "@/components/custom/search-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";

export default function ProductsClient({ query }: { query: string }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useViewMode(pathname);

  const { visibleProducts, total, hasMore, loadMore, isLoading, error } =
    useInfiniteProducts(query);

  return (
    <div className="space-y-4">
      <Suspense>
        <SearchBar
          placeholder="Pretraži proizvode..."
          searchRoute={pathname}
          clearable={true}
          allowScanning={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}"${
                isLoading ? "" : ` (${total}${total >= 100 ? "+" : ""})`
              }`
            : undefined}
        </h3>

        {/* <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} /> */}
      </div>

      {isLoading ? (
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
      ) : query && total === 0 ? (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      ) : query ? (
        <>
          {/* Virtualization debug info */}
          {/* <div className="text-sm text-gray-500 mb-4 p-2 bg-gray-50 rounded">
            🚀 Virtualizacija <br />
            {total} products split into{" "}
            {Math.ceil(total / virtualizationBatchSize)} batches of{" "}
            {virtualizationBatchSize} products. <br />
            Currently showing: {visibleProducts.length} products. <br />
            More to load: {hasMore ? "yes" : "no"}
          </div> */}
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

          {/* {hasMore && (
            <div className="py-6 text-center">
              <Button variant="outline" onClick={() => loadMore()}>
                Učitaj više
              </Button>
            </div>
          )} */}
        </>
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
