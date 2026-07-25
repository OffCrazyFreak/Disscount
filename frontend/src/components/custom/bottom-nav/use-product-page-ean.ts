"use client";

import { usePathname } from "next/navigation";

/** `/products/<ean>`, and nothing nested under it, since only that page has one */
const PRODUCT_PAGE = /^\/products\/([^/]+)\/?$/;

/**
 * The EAN of the product page you are on, or null anywhere else.
 *
 * Read from the path rather than `useParams`, because the bar is mounted in the
 * root layout and so never sees the route's own params.
 */
export default function useProductPageEan(): string | null {
  const match = PRODUCT_PAGE.exec(usePathname());

  return match ? decodeURIComponent(match[1]) : null;
}
