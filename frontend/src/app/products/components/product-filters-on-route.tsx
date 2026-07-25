"use client";

import { useSearchParams } from "next/navigation";
import ProductFiltersCollapsible from "@/app/products/components/product-filters-collapsible";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import useProductFilters from "@/app/products/hooks/use-product-filters";

/**
 * On the list a pick amends the URL, and the results behind the non-modal sheet
 * update live. The facets describe the submitted search, so they read `q`.
 */
export default function ProductFiltersOnRoute() {
  const filters = useProductFilters();
  const query = useSearchParams().get("q") ?? "";
  const facets = useProductFacets(query, filters);

  return <ProductFiltersCollapsible facets={facets} filters={filters} />;
}
