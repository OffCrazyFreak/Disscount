"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import ProductCard, {
  ProductItem,
} from "@/components/custom/products/product-card";
import ProductSearchBar from "@/components/custom/products/product-search-bar";
import SearchItemsLayout from "@/components/layouts/search-items-layout";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import { externalProductService } from "@/lib/api";
import { AnimatedGroup } from "@/components/ui/animated-group";

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

  // Use external products search API only when there's a query
  const {
    data: searchResults,
    isLoading,
    error,
  } = externalProductService.useSearchExternalProducts(
    !!initialQuery ? { q: initialQuery } : { q: "" }
  );

  // Transform external products to match ProductItem interface
  const productsList: ProductItem[] = searchResults
    ? searchResults.map((product) =>
        externalProductService.transformExternalProduct(product)
      )
    : [];

  const [viewMode, setViewMode] = useViewMode("/products", "grid");

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
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                filter: "blur(12px)",
                y: 12,
              },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: {
                  type: "spring" as const,
                  bounce: 0.3,
                  duration: 1.5,
                },
              },
            },
          }}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
              : "space-y-4"
          }
        >
          {productsList.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToList={handleAddToList}
            />
          ))}
        </AnimatedGroup>
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
