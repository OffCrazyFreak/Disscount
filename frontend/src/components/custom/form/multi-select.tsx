"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { Collapsible } from "@/components/ui/collapsible";
import { Popover } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MultiSelectContext,
  type MultiSelectPresentation,
} from "@/components/custom/form/multi-select-context";

// The compound parts live in their own files; this stays the single import path.
export { MultiSelectTrigger } from "@/components/custom/form/multi-select-trigger";
export { MultiSelectValue } from "@/components/custom/form/multi-select-value";
export { MultiSelectContent } from "@/components/custom/form/multi-select-content";
export {
  MultiSelectItem,
  MultiSelectGroup,
  MultiSelectSeparator,
} from "@/components/custom/form/multi-select-item";

interface IMultiSelectProps {
  children: ReactNode;
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
}

export function MultiSelect({
  children,
  values,
  defaultValues,
  onValuesChange,
}: IMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState(
    new Set<string>(values ?? defaultValues),
  );
  const [searchValue, setSearchValue] = useState("");
  const [items, setItems] = useState<Map<string, ReactNode>>(new Map());
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Below md the list drops into the page instead of floating, so a viewport
  // shrinking for the software keyboard has nothing to push it behind.
  // useIsMobile reports false on the server and the list only mounts on a tap,
  // so the swap at hydration is never on screen.
  const presentation: MultiSelectPresentation = useIsMobile()
    ? "inline"
    : "popover";

  // A controlled owner can change `values` behind our back, so the toggle reads
  // them rather than the internal set, which is only ever seeded once.
  const currentValues = values ? new Set(values) : selectedValues;

  function toggleValue(value: string) {
    const nextValues = new Set(currentValues);

    if (nextValues.has(value)) nextValues.delete(value);
    else nextValues.add(value);

    setSelectedValues(nextValues);
    onValuesChange?.([...nextValues]);
  }

  const onItemAdded = useCallback((value: string, label: ReactNode) => {
    setItems((prev) => {
      if (prev.get(value) === label) return prev;
      return new Map(prev).set(value, label);
    });
  }, []);

  // Clearing on close, not only when a value is added: a search left behind
  // reopened the list still filtered, which reads as the facet having no other
  // options. This is what the context hands out, so the paths that close the
  // list themselves (Escape on the inline one) clear it too.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSearchValue("");
  }

  const context = {
    open,
    setOpen: handleOpenChange,
    selectedValues: currentValues,
    toggleValue,
    searchValue,
    setSearchValue,
    items,
    onItemAdded,
    presentation,
    triggerRef,
  };

  return (
    <MultiSelectContext value={context}>
      {presentation === "inline" ? (
        <Collapsible open={open} onOpenChange={handleOpenChange}>
          {children}
        </Collapsible>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          {children}
        </Popover>
      )}
    </MultiSelectContext>
  );
}
