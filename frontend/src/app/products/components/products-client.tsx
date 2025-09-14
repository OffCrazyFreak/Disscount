"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import useInfiniteProducts from "@/app/products/hooks/useInfiniteProducts";
import { ProductList } from "@/app/products/components/product-list";
import { Button } from "@/components/ui/button-icon";
import { Suspense } from "react";
import ViewSwitcher from "@/components/custom/view-switcher";
import SearchBar from "@/components/custom/search-bar";

export default function ProductsClient({ query }: { query: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [viewMode, setViewMode] = useViewMode(pathname);

  const virtualizationBatchSize: number = 50;
  const { visibleProducts, total, hasMore, loadMore, isLoading, error } =
    useInfiniteProducts(query, virtualizationBatchSize);

  return (
    <div className="space-y-4">
      <Suspense>
        <SearchBar
          placeholder="Pretraži proizvode..."
          clearable={true}
          submitButtonLocation="Block"
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${total})`
            : undefined}
        </h3>

        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Pretraživanje...</span>
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

          <ProductList visibleProducts={visibleProducts} viewMode={viewMode} />
          {hasMore && (
            <div className="py-6 text-center">
              <Button variant="outline" size={"lg"} onClick={() => loadMore()}>
                Učitaj više
              </Button>
            </div>
          )}
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
