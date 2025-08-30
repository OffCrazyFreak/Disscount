"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import ProductCard from "@/app/products/components/product-card";
import ProductSearchBar from "@/app/products/components/product-search-bar";
import SearchItemsLayout from "@/components/layouts/search-items-layout";
import { useViewMode } from "@/hooks/use-view-mode";
import NoResults from "@/components/custom/no-results";
import { useProductSearch } from "@/app/products/api/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useState } from "react";
import { ProductResponse } from "./api/schemas";

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
    data: allProducts = [],
    isLoading,
    error,
  } = useProductSearch({
    q: initialQuery,
  });

  // Create batched products (50 items per batch). We'll load batches progressively on page scroll.
  const batchSize = 50;
  const batchedProducts = useMemo(() => {
    const batches: { items: typeof allProducts; isLoaded: boolean }[] = [];
    for (let i = 0; i < allProducts.length; i += batchSize) {
      batches.push({
        items: allProducts.slice(i, i + batchSize),
        isLoaded: true,
      });
    }
    return batches;
  }, [allProducts]);

  // How many batches we currently show (increase on page scroll)
  const [batchesToShow, setBatchesToShow] = useState<number>(
    batchedProducts.length > 0 ? 1 : 0
  );

  // Reset visible batches when the result set changes (new query)
  useEffect(() => {
    setBatchesToShow(batchedProducts.length > 0 ? 1 : 0);
  }, [batchedProducts.length, initialQuery]);

  // Visible products are the flattened items of visible batches
  const visibleProducts = useMemo(() => {
    return batchedProducts.slice(0, batchesToShow).flatMap((b) => b.items);
  }, [batchedProducts, batchesToShow]);

  // Listen to page scroll and increase batchesToShow when near bottom
  useEffect(() => {
    if (batchesToShow >= batchedProducts.length) return; // already loaded all

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewport = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // If user scrolled within 10000px from bottom, load next batch
      if (scrollY + viewport >= fullHeight - 10000) {
        setBatchesToShow((prev) => Math.min(prev + 1, batchedProducts.length));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [batchesToShow, batchedProducts.length]);

  // Virtualization setup - use page scroll (document.scrollingElement)
  const columns = 2; // we render 2 items per row in grid mode
  const rowCount =
    viewMode === "grid"
      ? Math.ceil(visibleProducts.length / columns)
      : visibleProducts.length;
  const virtualizer = useVirtualizer({
    count: rowCount,
    // use the page scrolling element so the virtualizer reacts to window/page scroll
    getScrollElement: () =>
      document.scrollingElement || document.documentElement,
    estimateSize: () => (viewMode === "grid" ? 140 : 100), // Estimated row height
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <SearchItemsLayout
      title={
        initialQuery.length > 0
          ? `Rezultati pretrage za "${initialQuery}" (${allProducts.length})`
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
      ) : initialQuery && allProducts.length === 0 ? (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      ) : initialQuery ? (
        <>
          {/* Debug info */}
          {/* {allProducts.length > 0 && (
            <div className="text-sm text-gray-500 mb-4 p-2 bg-gray-50 rounded">
              🚀 Virtualizacija: {allProducts.length} proizvoda prikazano u{" "}
              {batchedProducts.length} batch(a) po {batchSize}. Trenutno
              renderano: {virtualItems.length} redova.
            </div>
          )} */}

          <div>
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {viewMode === "grid" ? (
                // Grid layout - render 2 items per virtual row
                <div className="absolute top-0 left-0 w-full">
                  {virtualItems.map((virtualRow) => {
                    const startIndex = virtualRow.index * 2;
                    const endIndex = Math.min(
                      startIndex + 2,
                      visibleProducts.length
                    );
                    const rowProducts = visibleProducts.slice(
                      startIndex,
                      endIndex
                    );

                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-0"
                        style={{
                          position: "absolute",
                          top: virtualRow.start,
                          left: 0,
                          width: "100%",
                          minHeight: virtualRow.size,
                        }}
                      >
                        {rowProducts.map((product: ProductResponse) => (
                          <ProductCard
                            key={product.ean}
                            product={product}
                            onAddToList={handleAddToList}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // List layout - render 1 item per virtual row
                <div className="absolute top-0 left-0 w-full">
                  {virtualItems.map((virtualRow) => {
                    const product = visibleProducts[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: virtualRow.start,
                          left: 0,
                          width: "100%",
                          minHeight: virtualRow.size,
                        }}
                      >
                        <ProductCard
                          product={product}
                          onAddToList={handleAddToList}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
