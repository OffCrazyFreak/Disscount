"use client";

import { RemoveIconButton } from "@/components/custom/common/remove-icon-button";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IClearFiltersButtonProps {
  filters: IUseProductFiltersResult;
  /** Keeps the button in the layout while disabled, for a row that must not reflow */
  alwaysShow?: boolean;
  className?: string;
}

/**
 * Drops every active filter. Shared by the products page's two layouts and the
 * search sheet's panel, so they cannot label or gate it differently.
 *
 * Icon-only with a tooltip, since it sits beside the Filteri button on the
 * narrowest screens and a labelled button crowded it out.
 */
export default function ClearFiltersButton({
  filters,
  alwaysShow = false,
  className,
}: IClearFiltersButtonProps) {
  const hasFilters = filters.activeFilterCount > 0;

  if (!hasFilters && !alwaysShow) return null;

  return (
    <RemoveIconButton
      tone="neutral"
      label="Očisti filtere"
      disabled={!hasFilters}
      onClick={filters.clearFilters}
      className={className}
    />
  );
}
