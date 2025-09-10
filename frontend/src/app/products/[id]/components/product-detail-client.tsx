"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import cijeneService from "@/lib/cijene-api";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import { StoreChainCard } from "@/app/products/[id]/components/store-chain-card";
import { useUser } from "@/context/user-context";
import PriceHistory from "@/app/products/[id]/components/price-history/price-history-base";

export default function ProductDetailClient({ ean }: { ean: string }) {
  const { user } = useUser();

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

  // Group prices by chain
  const pricesByChain = React.useMemo(() => {
    if (!pricesData?.store_prices) return {};

    const grouped: Record<string, typeof pricesData.store_prices> = {};
    pricesData.store_prices.forEach((price) => {
      if (!grouped[price.chain]) {
        grouped[price.chain] = [];
      }
      grouped[price.chain].push(price);
    });
    return grouped;
  }, [pricesData]);

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="size-6 animate-spin" />
          Učitavanje proizvoda...
        </div>
      </div>
    );
  }

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
      {/* Product Information */}
      <ProductInfoDisplay product={product} />

      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Učitavanje povijesti
            cijena...
          </div>
        }
      >
        <PriceHistory ean={ean} product={product} />
      </Suspense>

      {/* Store Chain Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Cijene po lancima trgovina
        </h2>

        {pricesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              Učitavanje cijena...
            </div>
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

                // If both are pinned or both are not pinned, alphabetical order
                return a.chain.localeCompare(b.chain, "hr", {
                  sensitivity: "base",
                });
              })
              .map((chain, index) => {
                return (
                  <StoreChainCard
                    key={chain.chain}
                    chain={chain}
                    storePrices={pricesByChain[chain.chain] || []}
                    product={product}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
