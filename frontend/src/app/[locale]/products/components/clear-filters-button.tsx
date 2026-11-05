"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import RemoveIconButton from "@/components/custom/common/remove-icon-button";
import type { IUseProductFiltersResult } from "@/app/[locale]/products/hooks/use-product-filters";
import { cn } from "@/lib/utils";

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
  const t = useTranslations("products");
  const label = t("clearFilters.label");
  const hasFilters = filters.activeFilterCount > 0;

  if (showLabel) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={!hasFilters}
        className={className}
        onClick={filters.clearFilters}
      >
        <X className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <RemoveIconButton
      tone="neutral"
      label={label}
      disabled={!hasFilters}
      onClick={filters.clearFilters}
      className={cn("size-10", className)}
    />
  );
}
