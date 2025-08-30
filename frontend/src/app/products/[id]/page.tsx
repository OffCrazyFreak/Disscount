"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import cijeneService from "@/app/products/api";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import { StoreChainCard } from "@/app/products/[id]/components/store-chain-card";
import { ProductResponse } from "@/app/products/api/schemas";

interface ProductDetailsPageProps {
  product?: ProductResponse;
}

export default function ProductDetailsPage({
  product: propProduct,
}: ProductDetailsPageProps) {
  const params = useParams();
  const ean = params.id as string;

  // Fetch product data if not provided as prop
  const {
    data: fetchedProduct,
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

  const product = propProduct || fetchedProduct;

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
    <div>
      {/* Product Information */}
      <ProductInfoDisplay product={product} />

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
            {product.chains.map((chain, index) => (
              <StoreChainCard
                key={chain.chain}
                chain={chain}
                storePrices={pricesByChain[chain.chain] || []}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
