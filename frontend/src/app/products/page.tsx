"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import ProductCard from "@/components/custom/products/product-card";
import ProductSearchBar from "@/components/custom/products/product-search-bar";
import SharedListLayout from "@/components/custom/shared-list-layout";
import { filterByFields } from "@/lib/utils";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import { mockProducts } from "@/lib/mock/mock-products";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();

  function handleSearch(q: string) {
    if (!q) {
      router.push(`/products`);
    }
  }

  const handleAddToList = (productId: string | number) => {
    console.log(`Added product ${productId} to shopping list`);
  };

  const filteredProducts = filterByFields(mockProducts, initialQuery, [
    "name",
    "brand",
    "category",
  ]);

  const [viewMode, setViewMode] = useViewMode("/products", "grid");

  return (
    <SharedListLayout
      title={
        initialQuery.length > 0
          ? `Rezultati pretrage za "${initialQuery}" (${filteredProducts.length})`
          : undefined
      }
      search={<ProductSearchBar onSearch={handleSearch} showSubmitButton />}
      viewMode={viewMode}
      setViewMode={setViewMode}
    >
      {initialQuery && filteredProducts.length === 0 ? (
        <NoResults icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />} />
      ) : initialQuery ? (
        <>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToList={handleAddToList}
            />
          ))}
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="size-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Počnite pretraživanje
          </h3>
          <p className="text-gray-600 mb-6">Unesite naziv proizvoda koji tražite</p>
        </div>
      )}
    </SharedListLayout>
  );
}
                        
