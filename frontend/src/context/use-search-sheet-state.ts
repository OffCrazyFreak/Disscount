"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ISearchSheetContext } from "@/context/search-sheet-types";

/** The one route whose filters live inside the sheet, so arriving keeps it open. */
const FILTERED_ROUTE = "/products";

interface ISheetState {
  isOpen: boolean;
  areFiltersExpanded: boolean;
  openedOn: string;
}

/**
 * Open and expanded live in one object so an entry point sets both in a single
 * update: the sheet never renders at the wrong size for a frame, and no effect
 * is needed to reconcile them.
 */
export default function useSearchSheetState(): ISearchSheetContext {
  const pathname = usePathname();
  const fieldRef = useRef<HTMLInputElement>(null);
  const [queryDraft, setQueryDraft] = useState("");
  const [sheet, setSheet] = useState<ISheetState>({
    isOpen: false,
    areFiltersExpanded: false,
    openedOn: "",
  });

  // Leaving the route it was opened on closes it, the products list excepted.
  // Derived rather than reset in an effect, so it cannot be open for a frame on
  // a route that should already have dismissed it.
  const isOpen =
    sheet.isOpen &&
    (pathname === sheet.openedOn || pathname === FILTERED_ROUTE);

  const openWith = useCallback(
    (areFiltersExpanded: boolean) =>
      setSheet({ isOpen: true, areFiltersExpanded, openedOn: pathname }),
    [pathname],
  );

  const open = useCallback(() => openWith(false), [openWith]);
  const openFilters = useCallback(() => openWith(true), [openWith]);

  const close = useCallback(
    () => setSheet((current) => ({ ...current, isOpen: false })),
    [],
  );

  const toggle = useCallback(
    () => (isOpen ? close() : open()),
    [isOpen, close, open],
  );

  const setFiltersExpanded = useCallback(
    (areFiltersExpanded: boolean) =>
      setSheet((current) => ({ ...current, areFiltersExpanded })),
    [],
  );

  return {
    isOpen,
    areFiltersExpanded: sheet.areFiltersExpanded,
    queryDraft,
    fieldRef,
    open,
    openFilters,
    close,
    toggle,
    setFiltersExpanded,
    setQueryDraft,
  };
}
