"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { ProductSearchBar } from "@/app/products/components/product-search-bar";
import SearchItemsLayout from "@/components/layouts/search-items-layout";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import useInfiniteProducts from "@/app/products/hooks/useInfiniteProducts";
import { ProductList } from "@/app/products/components/product-list";
import { Button } from "@/components/ui/button-icon";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();

  function handleSearch(q: string) {
    if (!q) {
      router.push(`/products`);
    } else {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  }

  const handleAddToList = useCallback((productId: string | number) => {
    // keep handler stable to avoid passing a new function to many ProductCard instances
    console.log(`Added product ${productId} to shopping list`);
  }, []);

  const [viewMode, setViewMode] = useViewMode("/products", "grid");

  const virtualizationBatchSize: number = 50;
  const { visibleProducts, total, hasMore, loadMore, isLoading, error } =
    useInfiniteProducts(initialQuery, virtualizationBatchSize);

  return (
    <SearchItemsLayout
      title={
        initialQuery.length > 0
          ? `Rezultati pretrage za "${initialQuery}" (${total})`
          : undefined
      }
      search={<ProductSearchBar onSearch={handleSearch} showSubmitButton />}
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
          <Search className="size-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Greška pri pretraživanju
          </h3>
          <p className="text-gray-600 mb-6">
            Došlo je do greške pri dohvaćanju podataka. Pokušajte ponovo.
          </p>
        </div>
      ) : initialQuery && total === 0 ? (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      ) : initialQuery ? (
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

          <ProductList
            products={visibleProducts}
            viewMode={viewMode}
            onAddToList={handleAddToList}
          />
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
    </SearchItemsLayout>
  );
}
