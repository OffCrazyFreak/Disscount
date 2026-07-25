import type { RefObject } from "react";

export interface ISearchSheetContext {
  isOpen: boolean;
  /** Set deliberately by whichever control opened the sheet, never remembered */
  areFiltersExpanded: boolean;
  /** Whatever is typed, for the submit rule and for an off-route filter pick */
  queryDraft: string;
  fieldRef: RefObject<HTMLInputElement | null>;
  open: () => void;
  openFilters: () => void;
  close: () => void;
  toggle: () => void;
  setFiltersExpanded: (expanded: boolean) => void;
  setQueryDraft: (query: string) => void;
}
