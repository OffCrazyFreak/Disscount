"use client";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/custom/form/multi-select";
import { cn } from "@/lib/utils";
import type { IFacetSelect } from "@/app/products/hooks/use-product-facets";

interface IFacetMultiSelectProps {
  facet: IFacetSelect;
  /** Names the control for screen readers, e.g. "Trgovine" */
  label: string;
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
  label,
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
        aria-label={label}
        className={cn("w-full bg-white", className)}
        disabled={facet.disabled}
      >
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>

      <MultiSelectContent
        search={{ placeholder: searchPlaceholder, emptyMessage }}
      >
        <MultiSelectGroup>
          {facet.options.map((value) => {
            const optionLabel = getLabel?.(value) ?? value;
            const count = facet.counts?.[value];

            // Unavailable options stay listed but disabled; a selected one that
            // dropped to zero stays enabled so it can still be removed.
            const isDisabled = count === 0 && !facet.selected.includes(value);

            return (
              <MultiSelectItem
                key={value}
                value={value}
                badgeLabel={optionLabel}
                disabled={isDisabled}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{optionLabel}</span>
                  {count !== undefined && (
                    <span className="text-muted-foreground">({count})</span>
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
