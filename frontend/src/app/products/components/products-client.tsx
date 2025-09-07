"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { ProductSearchBar } from "@/app/products/components/product-search-bar";
import ProductsLayout from "@/app/products/layout";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import useInfiniteProducts from "@/app/products/hooks/useInfiniteProducts";
import { ProductList } from "@/app/products/components/product-list";
import { Button } from "@/components/ui/button-icon";
import { Suspense } from "react";

export default function ProductsClient({ query }: { query: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSearch(q: string) {
    if (!q) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?q=${encodeURIComponent(q)}`);
    }
  }

  const [viewMode, setViewMode] = useViewMode(pathname, "grid");

  const virtualizationBatchSize: number = 50;
  const { visibleProducts, total, hasMore, loadMore, isLoading, error } =
    useInfiniteProducts(query, virtualizationBatchSize);

  return (
    <ProductsLayout
      title={
        query.length > 0
          ? `Rezultati pretrage za "${query}" (${total})`
          : undefined
      }
      search={
        <Suspense>
          <ProductSearchBar onSearch={handleSearch} showSubmitButton />
        </Suspense>
      }
      viewMode={viewMode}
      setViewMode={setViewMode}
    >
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

          <ProductList products={visibleProducts} viewMode={viewMode} />
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
    </ProductsLayout>
  );
}
