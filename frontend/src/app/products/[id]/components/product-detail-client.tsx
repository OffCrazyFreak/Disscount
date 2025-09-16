"use client";

import { useCallback, useMemo, useState } from "react";
import cijeneService from "@/lib/cijene-api";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import { StoreItem } from "@/app/products/[id]/components/store-item/store-item";
import { useUser } from "@/context/user-context";
import PriceHistory from "@/app/products/[id]/components/price-history/price-history-base";
import Loading from "@/app/loading";

export default function ProductDetailClient({ ean }: { ean: string }) {
  const { user } = useUser();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const toggleStoreExpansion = useCallback((chainCode: string) => {
    setExpandedStore((prev: string | null) =>
      prev === chainCode ? null : chainCode
    );
  }, []);

  // Fetch current product data
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = cijeneService.useGetProductByEan({
    ean,
  });

  // Fetch prices data for the product
  const {
    data: pricesData,
    isLoading: pricesLoading,
    error: pricesError,
  } = cijeneService.useGetPrices({
    eans: ean,
  });

  // Group prices by store chain
  const pricesByStore = useMemo(() => {
    if (!pricesData?.store_prices) return {};

    const grouped: Record<string, typeof pricesData.store_prices> = {};
    pricesData.store_prices.forEach((price) => {
      const store = price.chain;

      if (!grouped[store]) {
        grouped[store] = [];
      }

      grouped[store].push(price);
    });
    return grouped;
  }, [pricesData]);

  // Show loading state while fetching product
  if (productLoading) {
    return <Loading />;
  }

  // Show error state if product failed to load or not found
  if (productError || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Proizvod nije pronađen
          </h2>
          <p className="text-gray-600">
            Nije moguće učitati podatke za ovaj proizvod.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProductInfoDisplay product={product} />

      <PriceHistory product={product} />

      {/* Store chain cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Cijene po lancima trgovina
        </h2>

        {pricesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loading />
          </div>
        ) : pricesError ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Greška pri učitavanju cijena. Pokušajte ponovno.
            </p>
          </div>
        ) : product.chains.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Nema dostupnih cijena za ovaj proizvod.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {product.chains
              .sort((a, b) => {
                // Get user's pinned store IDs
                const pinnedStoreIds =
                  user?.pinnedStores?.map((store) => store.storeApiId) || [];

                // Check if chains are pinned
                const aIsPinned = pinnedStoreIds.includes(a.chain);
                const bIsPinned = pinnedStoreIds.includes(b.chain);

                // Pinned chains come first
                if (aIsPinned && !bIsPinned) return -1;
                if (!aIsPinned && bIsPinned) return 1;

                // If both are pinned or both are not pinned, sort by prices (avg then min then max)
                const aAvg = parseFloat(a.avg_price);
                const bAvg = parseFloat(b.avg_price);
                if (aAvg !== bAvg) return aAvg - bAvg;

                const aMin = parseFloat(a.min_price);
                const bMin = parseFloat(b.min_price);
                if (aMin !== bMin) return aMin - bMin;

                const aMax = parseFloat(a.max_price);
                const bMax = parseFloat(b.max_price);
                if (aMax !== bMax) return aMax - bMax;

                // If all prices are equal, sort alphabetically
                return a.chain.localeCompare(b.chain, "hr", {
                  sensitivity: "base",
                });
              })
              .map((store) => {
                return (
                  <StoreItem
                    key={store.chain}
                    isExpanded={expandedStore === store.chain}
                    onToggle={() => toggleStoreExpansion(store.chain)}
                    store={store}
                    storePrices={pricesByStore[store.chain] || []}
                    product={product}
                  />
                );
              })}
          </div>
        )}
      </div>

      {/* TODO: cesto kupljeno zajedno section */}
    </div>
  );
}
