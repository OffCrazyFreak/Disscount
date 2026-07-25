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
  /** Registered by the sheet's field, so the shell can focus it on open */
  inputRef: RefObject<HTMLInputElement | null>;
  open: () => void;
  close: () => void;
}

const SearchSheetContext = createContext<ISearchSheetContext | null>(null);

interface ISearchSheetProviderProps {
  children: ReactNode;
}

/**
 * Holds the mobile search sheet open, so the bottom nav's centre tab can open a
 * sheet that lives outside it in the tree.
 */
export function SearchSheetProvider({ children }: ISearchSheetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, inputRef, open, close }),
    [isOpen, open, close],
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
