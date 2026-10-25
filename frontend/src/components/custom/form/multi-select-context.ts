"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * `popover` floats the list beside its trigger; `inline` drops it into the page
 * under the trigger. Chosen by viewport, not by the caller.
 */
export type MultiSelectPresentation = "popover" | "inline";

/** What "select all" needs to know about an option beyond its label. */
export interface IMultiSelectOption {
  keywords?: string[];
  disabled?: boolean;
}

export interface IMultiSelectContext {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedValues: Set<string>;
  toggleValue: (value: string) => void;
  /** Replaces the whole selection, for "select all" and "clear all". */
  setValues: (values: string[]) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  items: Map<string, ReactNode>;
  options: Map<string, IMultiSelectOption>;
  onItemAdded: (
    value: string,
    label: ReactNode,
    option?: IMultiSelectOption,
  ) => void;
  /** Drops an option no longer offered, so "select all" cannot pick it. */
  onItemRemoved: (value: string) => void;
  presentation: MultiSelectPresentation;
  /** Inline has no Radix layer to restore focus for it, so Escape does it by hand. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export const MultiSelectContext = createContext<IMultiSelectContext | null>(
  null,
);

export function useMultiSelectContext() {
  const context = useContext(MultiSelectContext);
  if (context == null) {
    throw new Error(
      "useMultiSelectContext must be used within a MultiSelectContext",
    );
  }
  return context;
}
