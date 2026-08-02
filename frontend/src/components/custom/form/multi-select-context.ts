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

export interface IMultiSelectContext {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedValues: Set<string>;
  toggleValue: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  items: Map<string, ReactNode>;
  onItemAdded: (value: string, label: ReactNode) => void;
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
