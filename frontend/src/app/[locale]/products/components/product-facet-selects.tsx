"use client";

import { useTranslations } from "next-intl";
import FacetMultiSelect from "@/app/[locale]/products/components/facet-multi-select";
import { getChainLabel } from "@/utils/labels";
import type { IProductFacetSelects } from "@/app/[locale]/products/hooks/use-product-facets";
import type {
  IUseProductFiltersResult,
  ProductFilterKey,
} from "@/app/[locale]/products/hooks/use-product-filters";

interface IFacetConfig {
  key: keyof IProductFacetSelects;
  filterKey: ProductFilterKey;
  messageKey: "stores" | "locations" | "categories" | "brands";
}

const FACETS: IFacetConfig[] = [
  { key: "chains", filterKey: "chain", messageKey: "stores" },
  { key: "locations", filterKey: "location", messageKey: "locations" },
  { key: "categories", filterKey: "category", messageKey: "categories" },
  { key: "brands", filterKey: "brand", messageKey: "brands" },
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
  const t = useTranslations("products");
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
            <p className="text-sm font-medium text-gray-700">
              {t(`facets.${facet.messageKey}.label`)}
            </p>
          )}

          <FacetMultiSelect
            facet={facets[facet.key]}
            label={t(`facets.${facet.messageKey}.label`)}
            placeholder={t(`facets.${facet.messageKey}.placeholder`)}
            searchPlaceholder={t(`facets.${facet.messageKey}.search`)}
            emptyMessage={t(`facets.${facet.messageKey}.empty`)}
            onValuesChange={(values) =>
              filters.setFilter(facet.filterKey, values)
            }
            getLabel={facet.key === "chains" ? getChainLabel : undefined}
            className={isStack ? "max-w-none" : undefined}
          />
        </div>
      ))}
    </>
  );
}
