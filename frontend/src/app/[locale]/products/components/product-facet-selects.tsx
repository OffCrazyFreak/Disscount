"use client";

import { useTranslations } from "next-intl";
import FacetMultiSelect from "@/app/[locale]/products/components/facet-multi-select";
import { getChainLabel } from "@/utils/labels";
import { selectsEveryOption } from "@/app/[locale]/products/utils/facets/selects-every-option";
import type { IProductFacetSelects } from "@/app/[locale]/products/hooks/use-product-facets";
import type {
  IUseProductFiltersResult,
  ProductFilterKey,
} from "@/app/[locale]/products/hooks/use-product-filters";

interface IFacetConfig {
  key: keyof IProductFacetSelects;
  filterKey: ProductFilterKey;
  messageKey: "stores" | "locations" | "categories" | "brands";
  /** Picking every option stores no filter, which gives the same results */
  allMeansNone?: boolean;
}

const FACETS: IFacetConfig[] = [
  { key: "chains", filterKey: "chain", messageKey: "stores" },
  // Every city written out made a 7.7 KB address.
  {
    key: "locations",
    filterKey: "location",
    messageKey: "locations",
    allMeansNone: true,
  },
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
              filters.setFilter(
                facet.filterKey,
                facet.allMeansNone &&
                  selectsEveryOption(facets[facet.key], values)
                  ? []
                  : values,
              )
            }
            getLabel={facet.key === "chains" ? getChainLabel : undefined}
            className={isStack ? "max-w-none" : undefined}
          />
        </div>
      ))}
    </>
  );
}
