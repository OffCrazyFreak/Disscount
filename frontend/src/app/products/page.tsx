"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import ProductCard from "@/app/products/components/product-card";
import ProductSearchBar from "@/app/products/components/product-search-bar";
import SearchItemsLayout from "@/components/layouts/search-items-layout";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import { useProductSearch } from "@/app/products/api/hooks";

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

  const handleAddToList = (productId: string | number) => {
    console.log(`Added product ${productId} to shopping list`);
  };

  const [viewMode, setViewMode] = useViewMode("/products", "grid");

  // Use the simplified search hook for Cijene API
  const {
    data: productsList,
    isLoading,
    error,
  } = useProductSearch({
    q: initialQuery,
  });

  return (
    <SearchItemsLayout
      title={
        initialQuery.length > 0
          ? `Rezultati pretrage za "${initialQuery}" (${productsList.length})`
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
      ) : initialQuery && productsList.length === 0 ? (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      ) : initialQuery ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
              : "space-y-4"
          }
        >
          {productsList.map((product) => (
            <ProductCard
              key={product.ean}
              product={product}
              onAddToList={handleAddToList}
            />
          ))}
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
    </SearchItemsLayout>
  );
}
