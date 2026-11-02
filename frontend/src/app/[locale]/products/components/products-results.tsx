"use client";

import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import ProductsGrid from "@/app/[locale]/products/components/products-grid";
import ProductsStatusMessage from "@/app/[locale]/products/components/products-status-message";
import ProductsEmptyResults from "@/app/[locale]/products/components/products-empty-results";
import type { IProductListItem } from "@/app/[locale]/products/typings/product-list-price-types";
import type { ViewMode } from "@/typings/view-mode";

interface IProductsResultsProps {
  query: string;
  isPending: boolean;
  hasError: boolean;
  total: number;
  activeFilterCount: number;
  clearFilters: () => void;
  selectedLocations: string[];
  hasMatchesOutsideLocations: boolean;
  showAllLocations: () => void;
  visibleItems: IProductListItem[];
  viewMode: ViewMode;
}

export default function ProductsResults({
  query,
  isPending,
  hasError,
  total,
  activeFilterCount,
  clearFilters,
  selectedLocations,
  hasMatchesOutsideLocations,
  showAllLocations,
  visibleItems,
  viewMode,
}: IProductsResultsProps) {
  const t = useTranslations("products");

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <BlockLoadingSpinner />
      </div>
    );
  }

  if (hasError) {
    return (
      <ProductsStatusMessage
        icon={<Search className="size-12 text-red-700 mx-auto mb-4" />}
        title={t("list.errorTitle")}
        text={t("list.errorText")}
      />
    );
  }

  if (query && total === 0) {
    return (
      <ProductsEmptyResults
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        selectedLocations={selectedLocations}
        hasMatchesOutsideLocations={hasMatchesOutsideLocations}
        showAllLocations={showAllLocations}
      />
    );
  }

  if (query) return <ProductsGrid items={visibleItems} viewMode={viewMode} />;

  if (activeFilterCount > 0) {
    return (
      <ProductsStatusMessage
        icon={
          <SlidersHorizontal className="size-12 text-gray-400 mx-auto mb-4" />
        }
        title={t("list.enterQueryTitle")}
        text={t("list.enterQueryText")}
      />
    );
  }

  return (
    <ProductsStatusMessage
      icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
      title={t("list.startTitle")}
      text={t("list.startText")}
    />
  );
}
