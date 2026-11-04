"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { Collapsible } from "@/components/ui/collapsible";
import { Popover } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MultiSelectContext,
  type IMultiSelectOption,
  type MultiSelectPresentation,
} from "@/components/custom/form/multi-select-context";

// One component per file, named back up here so this stays the single import path.
export { default as MultiSelectTrigger } from "@/components/custom/form/multi-select-trigger";
export { default as MultiSelectValue } from "@/components/custom/form/multi-select-value";
export { default as MultiSelectContent } from "@/components/custom/form/multi-select-content";
export { default as MultiSelectItem } from "@/components/custom/form/multi-select-item";
export { CommandGroup as MultiSelectGroup } from "@/components/ui/command";

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
  const [options, setOptions] = useState<Map<string, IMultiSelectOption>>(
    new Map(),
  );
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Below md the list drops into the page so a viewport shrinking for the keyboard has nothing to push it behind; the swap is never on screen at hydration.
  const presentation: MultiSelectPresentation = useIsMobile()
    ? "inline"
    : "popover";

  // Crossing the breakpoint remounts the list and refires autoFocus; adjusted during render so the wrong presentation never paints open for a frame.
  const [lastPresentation, setLastPresentation] = useState(presentation);
  if (presentation !== lastPresentation) {
    setLastPresentation(presentation);
    setOpen(false);
  }

  // A controlled owner can change `values`, so the toggle reads them rather than the internal set, which is seeded only once.
  const currentValues = values ? new Set(values) : selectedValues;

  function toggleValue(value: string) {
    const nextValues = new Set(currentValues);

    if (nextValues.has(value)) nextValues.delete(value);
    else nextValues.add(value);

    setSelectedValues(nextValues);
    onValuesChange?.([...nextValues]);
  }

  function setValues(next: string[]) {
    setSelectedValues(new Set(next));
    onValuesChange?.(next);
  }

  const onItemAdded = useCallback(
    (value: string, label: ReactNode, option: IMultiSelectOption = {}) => {
      setItems((prev) => {
        if (prev.get(value) === label) return prev;
        return new Map(prev).set(value, label);
      });
      setOptions((prev) => {
        const known = prev.get(value);
        if (
          known?.disabled === option.disabled &&
          known?.keywords?.join() === option.keywords?.join()
        ) {
          return prev;
        }
        return new Map(prev).set(value, option);
      });
    },
    [],
  );

  // Labels stay behind on purpose, so a selected value keeps its badge text.
  const onItemRemoved = useCallback((value: string) => {
    setOptions((prev) => {
      if (!prev.has(value)) return prev;
      const next = new Map(prev);
      next.delete(value);
      return next;
    });
  }, []);

  // Cleared on close, because a search left behind reopens the list filtered, which reads as the facet having no other options.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSearchValue("");
  }

  const context = {
    open,
    setOpen: handleOpenChange,
    selectedValues: currentValues,
    toggleValue,
    setValues,
    searchValue,
    setSearchValue,
    items,
    options,
    onItemAdded,
    onItemRemoved,
    presentation,
    triggerRef,
  };

  return (
    <MultiSelectContext value={context}>
      {presentation === "inline" ? (
        // Only this branch boxes the trigger, because Collapsible's root is a real div; with no zeroed minimum it would size to the badge row's min-content.
        <Collapsible
          className="min-w-0"
          open={open}
          onOpenChange={handleOpenChange}
        >
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
