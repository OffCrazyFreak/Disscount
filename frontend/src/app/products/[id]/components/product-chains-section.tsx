"use client";

import { useCallback, useState } from "react";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import CollapsibleSection from "@/components/custom/common/collapsible-section";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import StoreItem from "@/app/products/[id]/components/store-item/store-item";
import ProductChainSortSelect from "@/app/products/[id]/components/product-chain-sort-select";
import type { useProductDetail } from "@/app/products/[id]/hooks/use-product-detail";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getProductStoresOpen,
  setProductStoresOpen,
} from "@/utils/browser/local-storage";

interface IProductChainsSectionProps {
  ean: string;
  product: ProductResponse;
  detail: ReturnType<typeof useProductDetail>;
}

/** Every chain carrying this product, ordered by the reader's chosen sort. */
export default function ProductChainsSection({
  ean,
  product,
  detail,
}: IProductChainsSectionProps) {
  const [isOpen, setIsOpen] = useState(() => getProductStoresOpen(ean));
  const [expandedChain, setExpandedChain] = useState<string | null>(null);

  const toggleChain = useCallback((chainCode: string) => {
    setExpandedChain((previous) =>
      previous === chainCode ? null : chainCode,
    );
  }, []);

  function handleToggleSection(open: boolean) {
    setIsOpen(open);
    setProductStoresOpen(ean, open);
  }

  return (
    <CollapsibleSection
      title="Cijene po lancima trgovina"
      open={isOpen}
      onOpenChange={handleToggleSection}
    >
      {detail.pricesUpdatedAt > 0 && (
        <LastSyncedLabel
          updatedAt={detail.pricesUpdatedAt}
          prefix="Cijene osvježene"
          className="mb-3 block"
        />
      )}

      {detail.pricesLoading ? (
        <div className="grid place-items-center">
          <BlockLoadingSpinner />
        </div>
      ) : detail.pricesError ? (
        <p className="p-2 text-gray-600 text-center">
          Greška pri učitavanju cijena. Pokušajte ponovno.
        </p>
      ) : detail.sortedChains.length === 0 ? (
        <p className="p-2 text-gray-600 text-center">
          Nema dostupnih cijena za ovaj proizvod.
        </p>
      ) : (
        <div className="space-y-4">
          <ProductChainSortSelect
            value={detail.sortBy}
            onValueChange={detail.setSortBy}
          />

          {detail.sortedChains.map((chain) => (
            <StoreItem
              key={chain.chain}
              isExpanded={expandedChain === chain.chain}
              onToggle={() => toggleChain(chain.chain)}
              store={chain}
              storePrices={detail.pricesByChain[chain.chain] || []}
              product={product}
            />
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}
