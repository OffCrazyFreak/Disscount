"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import ProductCard from "@/components/custom/products/product-card";
import ProductSearchBar from "@/components/custom/products/product-search-bar";
import { filterByFields } from "@/lib/utils";
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
    // TODO: Replace with real mutation when ready
    // addToListMutation.mutate({
    //   productId: productId.toString(),
    //   quantity: 1
    // });

    // Placeholder for now
    console.log(`Added product ${productId} to shopping list`);
  };

  const filteredProducts = filterByFields(mockProducts, initialQuery, [
    "name",
    "brand",
    "category",
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="my-4">
        <ProductSearchBar onSearch={handleSearch} showSubmitButton />
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {initialQuery && filteredProducts.length === 0 ? (
          <NoResults
            icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
          />
        ) : initialQuery ? (
          <>
            <h2 className="text-lg my-8">
              Rezultati pretrage za &quot;{initialQuery}&quot; (
              {filteredProducts.length})
            </h2>
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
            <p className="text-gray-600">
              Unesite naziv proizvoda koji tražite
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
