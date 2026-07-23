"use client";

import FacetMultiSelect from "@/app/products/components/facet-multi-select";
import { getChainLabel } from "@/utils/labels";
import type { IProductFacetSelects } from "@/app/products/hooks/use-product-facets";
import type {
  IUseProductFiltersResult,
  ProductFilterKey,
} from "@/app/products/hooks/use-product-filters";

interface IFacetConfig {
  key: keyof IProductFacetSelects;
  filterKey: ProductFilterKey;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

const FACETS: IFacetConfig[] = [
  {
    key: "chains",
    filterKey: "chain",
    label: "Trgovine",
    placeholder: "Odaberi trgovine...",
    searchPlaceholder: "Pretraži trgovine...",
    emptyMessage: "Nema trgovina",
  },
  {
    key: "locations",
    filterKey: "location",
    label: "Lokacije",
    placeholder: "Odaberi lokacije...",
    searchPlaceholder: "Pretraži lokacije...",
    emptyMessage: "Nema lokacija",
  },
  {
    key: "categories",
    filterKey: "category",
    label: "Kategorije",
    placeholder: "Odaberi kategorije...",
    searchPlaceholder: "Pretraži kategorije...",
    emptyMessage: "Nema kategorija",
  },
  {
    key: "brands",
    filterKey: "brand",
    label: "Marka",
    placeholder: "Odaberi marku...",
    searchPlaceholder: "Pretraži marke...",
    emptyMessage: "Nema marki",
  },
];

interface IProductFacetSelectsProps {
  facets: IProductFacetSelects;
  filters: IUseProductFiltersResult;
  /** "stack" = labelled full-width rows (mobile sheet), "row" = inline bar */
  layout: "row" | "stack";
}

export default function ProductFacetSelects({
  facets,
  filters,
  layout,
}: IProductFacetSelectsProps) {
  const isStack = layout === "stack";

  return (
    <>
      {FACETS.map((facet) => (
        <div
          key={facet.key}
          // In a row the filters share the width evenly and may shrink.
          className={isStack ? "space-y-1.5" : "min-w-0 flex-1"}
        >
          {isStack && (
            <p className="text-sm font-medium text-gray-700">{facet.label}</p>
          )}

          <FacetMultiSelect
            facet={facets[facet.key]}
            label={facet.label}
            placeholder={facet.placeholder}
            searchPlaceholder={facet.searchPlaceholder}
            emptyMessage={facet.emptyMessage}
            onValuesChange={(values) =>
              filters.setFilter(facet.filterKey, values)
            }
            getLabel={facet.key === "chains" ? getChainLabel : undefined}
            className={isStack ? "max-w-none min-h-11" : undefined}
          />
        </div>
      ))}
    </>
  );
}
