"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/product-card";
import ProductSearchBar from "@/components/products/product-search-bar";
import { normalizeForSearch } from "@/lib/utils";

// import { useProductSearch } from "@/hooks/use-products";
// import { useAddToShoppingList } from "@/hooks/use-shopping-list";

// Example product data - will be replaced with API data later
const exampleProducts = [
  {
    id: 1,
    name: "Afrodita Sun Care  mlijekoš ZF30 200ml OS",
    category: "Piće",
    brand: "Vindija",
    quantity: "1L",
    averagePrice: 1.35,
    image: "/placeholder-product.jpg",
  },
  {
    id: 2,
    name: "Kruh integral",
    category: "Pekarski proizvodi",
    brand: "Klara",
    quantity: "500g",
    averagePrice: 0.85,
    image: "/placeholder-product.jpg",
  },
  {
    id: 3,
    name: "Jogurt prirodni",
    category: "Mliječni proizvodi",
    brand: "Dukat",
    quantity: "180g",
    averagePrice: 0.65,
    image: "/placeholder-product.jpg",
  },
  {
    id: 4,
    name: "Štap za šetnju",
    category: "Sport",
    brand: "Decathlon",
    quantity: "1kom",
    averagePrice: 15.99,
    image: "/placeholder-product.jpg",
  },
  {
    id: 5,
    name: "Stap za pecanje",
    category: "Šport",
    brand: "Shimano",
    quantity: "1kom",
    averagePrice: 89.99,
    image: "/placeholder-product.jpg",
  },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();

  function handleSearch(q: string) {
    if (!q) {
      router.push(`/products`);
    }
  }

  // TODO: Uncomment when ready to use real API
  // const { data: searchResult, isLoading, error } = useProductSearch(initialQuery);
  // const products = searchResult?.products || [];
  // const addToListMutation = useAddToShoppingList();

  const handleAddToList = (productId: string | number) => {
    // TODO: Replace with real mutation when ready
    // addToListMutation.mutate({
    //   productId: productId.toString(),
    //   quantity: 1
    // });

    // Placeholder for now
    console.log(`Added product ${productId} to shopping list`);
  };

  // TODO: Replace with React Query hook when ready to use real API
  // const { data: searchResult, isLoading, error } = useProductSearch(initialQuery);
  // const products = searchResult?.products || [];

  // Filter products based on normalized search query (handles Croatian & German letters)
  const qNorm = normalizeForSearch(initialQuery || "");
  const filteredProducts = exampleProducts.filter((product) => {
    if (!initialQuery) return true; // no query -> show all (handled by UI states)

    // Search against both original and normalized text
    const query = initialQuery.toLowerCase();
    const name = product.name || "";
    const brand = product.brand || "";
    const category = product.category || "";

    // Check original text (case-insensitive)
    const originalMatches =
      name.toLowerCase().includes(query) ||
      brand.toLowerCase().includes(query) ||
      category.toLowerCase().includes(query);

    // Check normalized text (diacritic-insensitive)
    const nameNorm = normalizeForSearch(name);
    const brandNorm = normalizeForSearch(brand);
    const categoryNorm = normalizeForSearch(category);

    const normalizedMatches =
      nameNorm.includes(qNorm) ||
      brandNorm.includes(qNorm) ||
      categoryNorm.includes(qNorm);

    return originalMatches || normalizedMatches;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="my-4">
        <ProductSearchBar onSearch={handleSearch} showSubmitButton />
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {initialQuery && filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nema rezultata
            </h3>
            <p className="text-gray-600">
              Probajte s drugim pojmom za pretraživanje
            </p>
          </div>
        ) : initialQuery ? (
          <>
            <h2 className="text-lg my-8">
              Rezultati pretrage za "{initialQuery}" ({filteredProducts.length})
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
