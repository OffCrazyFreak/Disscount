"use client";

import { useTranslations } from "next-intl";
import { ListPlus, Search } from "lucide-react";
import NoResults from "@/components/custom/common/no-results";
import { Button } from "@/components/ui/button";
import NoPriceInLocations from "@/app/[locale]/products/components/no-price-in-locations";
import { openModalUrl } from "@/lib/modal/modal-navigation";

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
    <div>
      <NoResults
        icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        description={t("list.noResultsAddPlain")}
      />
      <div className="text-center">
        <Button
          type="button"
          effect="shineHover"
          onClick={() =>
            openModalUrl({ name: "add-plain-item", itemName: query.trim() })
          }
        >
          <ListPlus aria-hidden="true" className="size-5" />
          {t("list.addPlainItem", { query: query.trim() })}
        </Button>
      </div>
    </div>
  );
}
