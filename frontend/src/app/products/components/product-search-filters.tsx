"use client";

import { usePathname } from "next/navigation";
import ProductSearchFiltersPanel from "@/app/products/components/product-search-filters-panel";

/** The products list, the only route with a result set these filters can narrow */
const FILTERABLE_ROUTE = "/products";

/**
 * Gate for the search sheet's filters, which the root layout mounts on every
 * route. The panel writes filters to whatever path it is on, so off the list it
 * must not mount at all rather than merely render nothing: an exact match also
 * keeps it off a product's own page, which has no result set to narrow.
 */
export default function ProductSearchFilters() {
  const pathname = usePathname();

  return pathname === FILTERABLE_ROUTE ? <ProductSearchFiltersPanel /> : null;
}
