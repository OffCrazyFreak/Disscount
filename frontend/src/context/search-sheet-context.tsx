"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

interface ISearchSheetContext {
  isOpen: boolean;
  /** The expanded filters, which every open starts without */
  areFiltersOpen: boolean;
  setAreFiltersOpen: (open: boolean) => void;
  /** Registered by the sheet's field, so the shell can focus it on open */
  inputRef: RefObject<HTMLInputElement | null>;
  open: () => void;
  /** The products page's Filteri button, which has no sheet of its own */
  openFilters: () => void;
  close: () => void;
}

const SearchSheetContext = createContext<ISearchSheetContext | null>(null);

interface ISearchSheetProviderProps {
  children: ReactNode;
}

/**
 * Holds the mobile search sheet open, so the bottom nav's centre tab can open a
 * sheet that lives outside it in the tree.
 *
 * The filters live here too rather than in the sheet, so each entry point decides
 * their state in the same batch that opens: the centre cell always lands on the
 * compact sheet, the products page's Filteri button lands on the expanded one.
 */
export function SearchSheetProvider({ children }: ISearchSheetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const open = useCallback(() => {
    setAreFiltersOpen(false);
    setIsOpen(true);
  }, []);

  const openFilters = useCallback(() => {
    setAreFiltersOpen(true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      areFiltersOpen,
      setAreFiltersOpen,
      inputRef,
      open,
      openFilters,
      close,
    }),
    [isOpen, areFiltersOpen, open, openFilters, close],
  );

  return (
    <SearchSheetContext.Provider value={value}>
      {children}
    </SearchSheetContext.Provider>
  );
}

export function useSearchSheet() {
  const context = useContext(SearchSheetContext);
  if (!context) {
    throw new Error("useSearchSheet must be used within a SearchSheetProvider");
  }

  return context;
}
