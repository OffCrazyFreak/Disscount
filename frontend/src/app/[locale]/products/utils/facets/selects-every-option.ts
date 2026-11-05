import type { IFacetSelect } from "@/app/[locale]/products/hooks/use-product-facets";

/**
 * Whether the values pick every option that has results. Options with none
 * are disabled and "select all" skips them, so they do not count.
 */
export function selectsEveryOption(
  facet: IFacetSelect,
  values: string[],
): boolean {
  const chosen = new Set(values);
  const available = facet.options.filter(
    (option) => facet.counts?.[option] !== 0,
  );

  return (
    available.length > 1 && available.every((option) => chosen.has(option))
  );
}
