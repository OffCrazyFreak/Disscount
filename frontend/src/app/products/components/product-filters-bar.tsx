"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import StoreChainMultiSelect from "@/components/custom/store-chain-multi-select";
import { useListChains } from "@/lib/cijene-api";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import type { IUseProductFiltersResult } from "@/app/products/hooks/useProductFilters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  categoryOptions: string[];
  brandOptions: string[];
}

/**
 * Keep options currently selected (e.g. from a shared URL) visible and
 * removable even when the current results no longer contain them.
 */
function unionWithSelected(options: string[], selected: string[]): string[] {
  const known = new Set(options);
  const stale = selected.filter((value) => !known.has(value));

  return stale.length > 0 ? [...options, ...stale] : options;
}

export default function ProductFiltersBar({
  filters,
  categoryOptions,
  brandOptions,
}: IProductFiltersBarProps) {
  const { data: chainsData } = useListChains();
  const { data: locations } = useAllLocations();

  const sortedLocations = useMemo(() => {
    return [...(locations ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "hr", { sensitivity: "base" }),
    );
  }, [locations]);

  const locationValues = useMemo(
    () =>
      unionWithSelected(
        sortedLocations.map((location) => location.name),
        filters.selectedLocations,
      ),
    [sortedLocations, filters.selectedLocations],
  );

  const storeCountByLocation = useMemo(() => {
    return new Map(
      sortedLocations.map((location) => [location.name, location.storeCount]),
    );
  }, [sortedLocations]);

  const categoryValues = useMemo(
    () => unionWithSelected(categoryOptions, filters.selectedCategories),
    [categoryOptions, filters.selectedCategories],
  );

  const brandValues = useMemo(
    () => unionWithSelected(brandOptions, filters.selectedBrands),
    [brandOptions, filters.selectedBrands],
  );

  const showCategories =
    categoryValues.length > 0 || filters.selectedCategories.length > 0;
  const showBrands =
    brandValues.length > 0 || filters.selectedBrands.length > 0;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      <StoreChainMultiSelect
        chains={chainsData?.chains ?? []}
        selectedChains={filters.selectedChains}
        onChainsChange={(values) => filters.setFilter("chain", values)}
        placeholder="Trgovine"
        className="shrink-0 max-w-64 bg-white"
      />

      <MultiSelect
        values={filters.selectedLocations}
        onValuesChange={(values) => filters.setFilter("location", values)}
      >
        <MultiSelectTrigger className="shrink-0 max-w-64 bg-white">
          <MultiSelectValue placeholder="Lokacije" />
        </MultiSelectTrigger>
        <MultiSelectContent
          search={{
            placeholder: "Pretraži lokacije...",
            emptyMessage: "Nema lokacija",
          }}
        >
          <MultiSelectGroup>
            {locationValues.map((name) => (
              <MultiSelectItem key={name} value={name} badgeLabel={name}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{name}</span>
                  {storeCountByLocation.has(name) && (
                    <span className="text-muted-foreground">
                      ({storeCountByLocation.get(name)})
                    </span>
                  )}
                </span>
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>

      {showCategories && (
        <MultiSelect
          values={filters.selectedCategories}
          onValuesChange={(values) => filters.setFilter("category", values)}
        >
          <MultiSelectTrigger className="shrink-0 max-w-64 bg-white">
            <MultiSelectValue placeholder="Kategorije" />
          </MultiSelectTrigger>
          <MultiSelectContent
            search={{
              placeholder: "Pretraži kategorije...",
              emptyMessage: "Nema kategorija",
            }}
          >
            <MultiSelectGroup>
              {categoryValues.map((category) => (
                <MultiSelectItem key={category} value={category}>
                  {category}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>
      )}

      {showBrands && (
        <MultiSelect
          values={filters.selectedBrands}
          onValuesChange={(values) => filters.setFilter("brand", values)}
        >
          <MultiSelectTrigger className="shrink-0 max-w-64 bg-white">
            <MultiSelectValue placeholder="Brendovi" />
          </MultiSelectTrigger>
          <MultiSelectContent
            search={{
              placeholder: "Pretraži brendove...",
              emptyMessage: "Nema brendova",
            }}
          >
            <MultiSelectGroup>
              {brandValues.map((brand) => (
                <MultiSelectItem key={brand} value={brand}>
                  {brand}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>
      )}

      {filters.activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground"
          onClick={filters.clearFilters}
        >
          <X className="size-4" />
          Očisti filtere
        </Button>
      )}
    </div>
  );
}
