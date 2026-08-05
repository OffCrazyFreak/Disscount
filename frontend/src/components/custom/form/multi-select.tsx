"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { Collapsible } from "@/components/ui/collapsible";
import { Popover } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MultiSelectContext,
  type MultiSelectPresentation,
} from "@/components/custom/form/multi-select-context";

// One component per file, named back up here so this stays the single import
// path and no call site has to know the layout.
export { default as MultiSelectTrigger } from "@/components/custom/form/multi-select-trigger";
export { default as MultiSelectValue } from "@/components/custom/form/multi-select-value";
export { default as MultiSelectContent } from "@/components/custom/form/multi-select-content";
export { default as MultiSelectItem } from "@/components/custom/form/multi-select-item";
export { default as MultiSelectGroup } from "@/components/custom/form/multi-select-group";
export { default as MultiSelectSeparator } from "@/components/custom/form/multi-select-separator";

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

  // Crossing the breakpoint swaps Popover for Collapsible, which remounts the
  // list and re-fires the search field's autoFocus. Rotating a tablet with a
  // facet open would otherwise pop the keyboard nobody asked for.
  //
  // Adjusted during render rather than in an effect, which is React's own
  // guidance for resetting state when a derived value changes: an effect would
  // paint the wrong presentation open for one frame first.
  const [lastPresentation, setLastPresentation] = useState(presentation);
  if (presentation !== lastPresentation) {
    setLastPresentation(presentation);
    setOpen(false);
  }

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
