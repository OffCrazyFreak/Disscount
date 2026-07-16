"use client";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import type { IFacetSelect } from "@/app/products/hooks/useProductFacets";

interface IFacetMultiSelectProps {
  facet: IFacetSelect;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  onValuesChange: (values: string[]) => void;
  getLabel?: (value: string) => string;
  className?: string;
}

/** One filter dropdown: searchable multi-select with optional option counts */
export default function FacetMultiSelect({
  facet,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  onValuesChange,
  getLabel,
  className,
}: IFacetMultiSelectProps) {
  return (
    <MultiSelect values={facet.selected} onValuesChange={onValuesChange}>
      <MultiSelectTrigger
        className={cn("shrink-0 max-w-64 bg-white", className)}
        disabled={facet.disabled}
      >
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>

      <MultiSelectContent
        search={{ placeholder: searchPlaceholder, emptyMessage }}
      >
        <MultiSelectGroup>
          {facet.options.map((value) => {
            const label = getLabel?.(value) ?? value;

            return (
              <MultiSelectItem key={value} value={value} badgeLabel={label}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{label}</span>
                  {facet.counts?.[value] !== undefined && (
                    <span className="text-muted-foreground">
                      ({facet.counts[value]})
                    </span>
                  )}
                </span>
              </MultiSelectItem>
            );
          })}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
}
