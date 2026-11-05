"use client";

import { useCallback, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinned } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import StoreItem from "@/app/[locale]/products/[id]/components/store-item/store-item";
import ProductChainSortSelect from "@/app/[locale]/products/[id]/components/product-chain-sort-select";
import DistanceSortNote from "@/components/custom/distance-sort/distance-sort-note";
import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import { useStoreHoursNow } from "@/components/custom/store-hours/use-store-hours-now";
import type { useProductDetail } from "@/app/[locale]/products/[id]/hooks/use-product-detail";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

interface IProductChainsSectionProps {
  product: ProductResponse;
  detail: ReturnType<typeof useProductDetail>;
}

/** Every chain carrying this product, ordered by the reader's chosen sort. */
export default function ProductChainsSection({
  product,
  detail,
}: IProductChainsSectionProps) {
  const t = useTranslations("productDetail.chains");
  // Shared with the section bar, so the link and the heading always read the same.
  const [expandedChain, setExpandedChain] = useState<string | null>(null);
  const sortNoteId = useId();
  // Fetched once a badge can show: a store table is open or a nearest store is named.
  const hours = useStoreHoursNow({
    enabled: expandedChain !== null || detail.shownNearestStores !== undefined,
  });

  const toggleChain = useCallback((chainCode: string) => {
    setExpandedChain((previous) => (previous === chainCode ? null : chainCode));
  }, []);

  // The chain rows need only the product, so they render before the store prices arrive.
  const pricesStatus = detail.pricesLoading
    ? "pending"
    : detail.pricesError
      ? "error"
      : "success";

  return (
    <StoreHoursProvider hours={hours}>
      <div className="space-y-2">
        {detail.pricesUpdatedAt > 0 && (
          <LastSyncedLabel
            updatedAt={detail.pricesUpdatedAt}
            label={(time) => t("refreshed", { time })}
            className="mb-3 block"
          />
        )}

        {detail.sortedChains.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ProductChainSortSelect
                value={detail.sortBy}
                onValueChange={detail.setSortBy}
                describedById={sortNoteId}
              />

              <Link
                href={`/map?chain=${encodeURIComponent(detail.sortedChains.map((chain) => chain.chain).join(","))}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <MapPinned aria-hidden="true" />
                {t("whereToBuy")}
              </Link>
            </div>

            <DistanceSortNote
              id={sortNoteId}
              state={detail.distanceState}
              origin={detail.distanceOrigin}
              towns={detail.distanceTowns}
              onPickTown={detail.sortFromTown}
            />

            {detail.sortedChains.map((chain) => (
              <StoreItem
                key={chain.chain}
                isExpanded={expandedChain === chain.chain}
                onToggle={() => toggleChain(chain.chain)}
                store={chain}
                storePrices={detail.pricesByChain[chain.chain] || []}
                pricesStatus={pricesStatus}
                product={product}
                nearest={detail.shownNearestStores?.get(chain.chain)}
              />
            ))}
          </div>
        )}
      </div>
    </StoreHoursProvider>
  );
}
