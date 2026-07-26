"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RemoveIconButton } from "@/components/custom/common/remove-icon-button";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

const LABEL = "Očisti filtere";

interface IClearFiltersButtonProps {
  filters: IUseProductFiltersResult;
  /** Names itself instead of leaning on a tooltip, for the widths that have room */
  showLabel?: boolean;
  className?: string;
}

/**
 * Drops every active filter. Shared by the products page's two layouts and the
 * products sheet's panel, so they cannot label or gate it differently.
 *
 * Always mounted and merely disabled when there is nothing to clear, so no filter
 * surface reflows as filters come and go.
 */
export default function ClearFiltersButton({
  filters,
  showLabel = false,
  className,
}: IClearFiltersButtonProps) {
  const hasFilters = filters.activeFilterCount > 0;

  if (showLabel) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasFilters}
        className={className}
        onClick={filters.clearFilters}
      >
        <X className="size-4" />
        {LABEL}
      </Button>
    );
  }

  return (
    <RemoveIconButton
      tone="neutral"
      label={LABEL}
      disabled={!hasFilters}
      onClick={filters.clearFilters}
      className={className}
    />
  );
}
