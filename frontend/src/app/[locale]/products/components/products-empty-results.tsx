"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import NoResults from "@/components/custom/common/no-results";
import { Button } from "@/components/ui/button";
import NoPriceInLocations from "@/app/[locale]/products/components/no-price-in-locations";

interface IProductsEmptyResultsProps {
  activeFilterCount: number;
  clearFilters: () => void;
  selectedLocations: string[];
  hasMatchesOutsideLocations: boolean;
  showAllLocations: () => void;
}

/** A search that returned nothing, worded by what the filters ruled out. */
export default function ProductsEmptyResults({
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
        <div className="text-center">
          <Button type="button" variant="outline" onClick={clearFilters}>
            {t("list.clearFilters")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NoResults
      icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
    />
  );
}
