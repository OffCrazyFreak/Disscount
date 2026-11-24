"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import NoResults from "@/components/custom/common/feedback/no-results";
import { Button } from "@/components/ui/button";
import AddPlainItemButton from "@/features/products/components/results/add-plain-item-button";
import NoPriceInLocations from "@/features/products/components/results/no-price-in-locations";

interface IProductsEmptyResultsProps {
  query: string;
  activeFilterCount: number;
  clearFilters: () => void;
  selectedLocations: string[];
  hasMatchesOutsideLocations: boolean;
  showAllLocations: () => void;
}

export default function ProductsEmptyResults({
  query,
  activeFilterCount,
  clearFilters,
  selectedLocations,
  hasMatchesOutsideLocations,
  showAllLocations,
}: IProductsEmptyResultsProps) {
  const t = useTranslations("products");

  if (hasMatchesOutsideLocations) {
    return (
      <NoPriceInLocations
        query={query}
        locations={selectedLocations}
        onShowAllLocations={showAllLocations}
      />
    );
  }

  if (activeFilterCount > 0) {
    return (
      <div>
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
          description={t("list.noResultsForFilters")}
        />
        <div className="flex flex-wrap justify-center gap-3">
          <AddPlainItemButton query={query} />

          <Button type="button" variant="outline" onClick={clearFilters}>
            {t("list.clearFilters")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NoResults
        icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        description={t("list.noResultsAddPlain")}
      />
      <div className="flex justify-center">
        <AddPlainItemButton query={query} />
      </div>
    </div>
  );
}
