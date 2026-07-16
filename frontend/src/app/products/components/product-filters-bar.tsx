"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import FacetMultiSelect from "@/app/products/components/facet-multi-select";
import useProductFacets from "@/app/products/hooks/useProductFacets";
import { storeNamesMap } from "@/constants/name-mappings";
import type { IUseProductFiltersResult } from "@/app/products/hooks/useProductFilters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

export default function ProductFiltersBar({
  filters,
  query,
}: IProductFiltersBarProps) {
  const facets = useProductFacets(query, filters);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      <FacetMultiSelect
        facet={facets.chains}
        placeholder="Trgovine"
        searchPlaceholder="Pretraži trgovine..."
        emptyMessage="Nema trgovina"
        onValuesChange={(values) => filters.setFilter("chain", values)}
        getLabel={(code) => storeNamesMap[code] || code}
      />

      <FacetMultiSelect
        facet={facets.locations}
        placeholder="Lokacije"
        searchPlaceholder="Pretraži lokacije..."
        emptyMessage="Nema lokacija"
        onValuesChange={(values) => filters.setFilter("location", values)}
      />

      <FacetMultiSelect
        facet={facets.categories}
        placeholder="Kategorije"
        searchPlaceholder="Pretraži kategorije..."
        emptyMessage="Nema kategorija"
        onValuesChange={(values) => filters.setFilter("category", values)}
      />

      <FacetMultiSelect
        facet={facets.brands}
        placeholder="Brendovi"
        searchPlaceholder="Pretraži brendove..."
        emptyMessage="Nema brendova"
        onValuesChange={(values) => filters.setFilter("brand", values)}
      />

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
