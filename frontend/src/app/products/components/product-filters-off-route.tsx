"use client";

import ProductFiltersCollapsible from "@/app/products/components/product-filters-collapsible";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import useOffRouteFilters from "@/app/products/hooks/use-off-route-filters";

/**
 * Anywhere else the query is deliberately empty: that fetches nothing, and it
 * stops another page's own `q` (the map's is store names) facetting products.
 */
export default function ProductFiltersOffRoute() {
  const filters = useOffRouteFilters();
  const facets = useProductFacets("", filters);

  return <ProductFiltersCollapsible facets={facets} filters={filters} />;
}
