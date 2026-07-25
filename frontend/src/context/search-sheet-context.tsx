"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** The one route whose filters live inside the sheet, so it may stay open there */
const PRODUCTS_ROUTE = "/products";

interface ISearchSheetState {
  isOpen: boolean;
  filtersExpanded: boolean;
}

const CLOSED: ISearchSheetState = { isOpen: false, filtersExpanded: false };

interface ISearchSheetContext extends ISearchSheetState {
  /** Opening and expanding land in one batch, so the sheet never renders at the
   *  wrong size for a frame */
  openSheet: (options?: { filtersExpanded?: boolean }) => void;
  closeSheet: () => void;
  toggleSheet: () => void;
  setFiltersExpanded: (expanded: boolean) => void;
}

const SearchSheetContext = createContext<ISearchSheetContext | null>(null);

interface ISearchSheetProviderProps {
  children: ReactNode;
}

export function SearchSheetProvider({ children }: ISearchSheetProviderProps) {
  const pathname = usePathname();
  const [state, setState] = useState<ISearchSheetState>(CLOSED);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close on any pathname change except an exact match on the products list.
  // Exact, not a prefix: a product's own page has no result set to filter.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (pathname !== PRODUCTS_ROUTE) setState(CLOSED);
  }

  function openSheet(options?: { filtersExpanded?: boolean }) {
    // Always collapsed unless asked otherwise, so the centre cell never opens a
    // tall sheet nobody asked for.
    setState({
      isOpen: true,
      filtersExpanded: Boolean(options?.filtersExpanded),
    });
  }

  return (
    <SearchSheetContext
      value={{
        ...state,
        openSheet,
        closeSheet: () => setState(CLOSED),
        toggleSheet: () => (state.isOpen ? setState(CLOSED) : openSheet()),
        setFiltersExpanded: (filtersExpanded) =>
          setState((current) => ({ ...current, filtersExpanded })),
      }}
    >
      {children}
    </SearchSheetContext>
  );
}

export function useSearchSheet(): ISearchSheetContext {
  const context = useContext(SearchSheetContext);

  if (!context) {
    throw new Error("useSearchSheet must be used within a SearchSheetProvider");
  }

  return context;
}
