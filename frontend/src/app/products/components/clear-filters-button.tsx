"use client";

import { type ComponentProps } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IClearFiltersButtonProps {
  filters: IUseProductFiltersResult;
  size?: ComponentProps<typeof Button>["size"];
  /** Keeps the button in the layout while disabled, for a row that must not reflow */
  alwaysShow?: boolean;
  className?: string;
}

/**
 * Drops every active filter. Shared by the products page's two layouts and the
 * search sheet's panel, so they cannot label or gate it differently.
 */
export default function ClearFiltersButton({
  filters,
  size = "sm",
  alwaysShow = false,
  className,
}: IClearFiltersButtonProps) {
  const hasFilters = filters.activeFilterCount > 0;

  if (!hasFilters && !alwaysShow) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      disabled={!hasFilters}
      className={cn("text-muted-foreground", className)}
      onClick={filters.clearFilters}
    >
      <X className="size-4" />
      Očisti filtere
    </Button>
  );
}
