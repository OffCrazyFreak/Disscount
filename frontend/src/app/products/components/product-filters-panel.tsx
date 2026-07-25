"use client";

import { usePathname } from "next/navigation";
import ProductFiltersOffRoute from "@/app/products/components/product-filters-off-route";
import ProductFiltersOnRoute from "@/app/products/components/product-filters-on-route";

const PRODUCTS_ROUTE = "/products";

/**
 * A guard in its own file, holding no hook but the pathname, because a component
 * that owns hooks cannot pick a branch without changing its hook order between
 * renders. Exact equality: a product's own page has no result set to filter.
 */
export default function ProductFiltersPanel() {
  return usePathname() === PRODUCTS_ROUTE ? (
    <ProductFiltersOnRoute />
  ) : (
    <ProductFiltersOffRoute />
  );
}
