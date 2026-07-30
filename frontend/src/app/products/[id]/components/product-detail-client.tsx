"use client";

import ProductInfoDisplay from "@/app/products/components/product-info-display";
import PriceHistory from "@/app/products/[id]/components/price-history/price-history-base";
import ProductChainsSection from "@/app/products/[id]/components/product-chains-section";
import ProductDetailSkeleton from "@/app/products/[id]/components/product-detail-skeleton";
import AsyncSection from "@/components/custom/common/async-section";
import ErrorState from "@/components/custom/common/error-state";
import { useDataPending } from "@/lib/query/use-data-pending";
import { useProductDetail } from "@/app/products/[id]/hooks/use-product-detail";

interface IProductDetailClientProps {
  ean: string;
}

export default function ProductDetailClient({
  ean,
}: IProductDetailClientProps) {
  const detail = useProductDetail(ean);
  const { product, productPending, productError } = detail;

  const pending = useDataPending(productPending);

  return (
    <AsyncSection
      pending={pending}
      // A settled fetch with no product means this EAN is not in the feed.
      error={
        productError ?? (product ? undefined : new Error("Nije pronađeno"))
      }
      errorState={
        <ErrorState
          title="Proizvod nije pronađen"
          fallbackMessage="Nije moguće učitati podatke za ovaj proizvod."
        />
      }
      skeleton={<ProductDetailSkeleton />}
    >
      {product && (
        <div className="space-y-4">
          <section>
            <ProductInfoDisplay product={product} />
          </section>

          <section>
            <PriceHistory key={product.ean} product={product} />
          </section>

          <section>
            <ProductChainsSection ean={ean} product={product} detail={detail} />
          </section>
        </div>
      )}
    </AsyncSection>
  );
}
