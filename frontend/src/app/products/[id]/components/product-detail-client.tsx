"use client";

import ProductInfoDisplay from "@/app/products/components/product-info-display";
import PriceHistory from "@/app/products/[id]/components/price-history/price-history-base";
import ProductChainsSection from "@/app/products/[id]/components/product-chains-section";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import { useProductDetail } from "@/app/products/[id]/hooks/use-product-detail";

export default function ProductDetailClient({ ean }: { ean: string }) {
  const detail = useProductDetail(ean);
  const { product, productLoading, productError } = detail;

  if (productLoading) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
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
      <section>
        <ProductInfoDisplay product={product} />
      </section>

      <section>
        <PriceHistory product={product} />
      </section>

      <section>
        <ProductChainsSection ean={ean} product={product} detail={detail} />
      </section>
    </div>
  );
}
