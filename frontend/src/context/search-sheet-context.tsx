"use client";

import { createContext, useContext, type ReactNode } from "react";
import useSearchSheetState from "@/context/use-search-sheet-state";
import type { ISearchSheetContext } from "@/context/search-sheet-types";

const SearchSheetContext = createContext<ISearchSheetContext | null>(null);

interface ISearchSheetProviderProps {
  children: ReactNode;
}

export function SearchSheetProvider({ children }: ISearchSheetProviderProps) {
  const value = useSearchSheetState();

  return (
    <SearchSheetContext.Provider value={value}>
      {children}
    </SearchSheetContext.Provider>
  );
}

export function useSearchSheet(): ISearchSheetContext {
  const context = useContext(SearchSheetContext);

  if (!context)
    throw new Error("useSearchSheet must be used within a SearchSheetProvider");

  return context;
}
