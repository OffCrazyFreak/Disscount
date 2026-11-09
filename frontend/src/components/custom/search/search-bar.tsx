"use client";

import { useCallback, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import SearchBarField, {
  type ISearchBarFieldOptions,
} from "@/components/custom/search/search-bar-field";
import SearchActionButton from "@/components/custom/search/search-action-button";
import {
  dismissTouchKeyboard,
  isTouchPointer,
} from "@/utils/browser/touch-keyboard";
import { useSearchBarQuery } from "@/components/custom/search/use-search-bar-query";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import { useSidebar } from "@/components/ui/sidebar";
import type { ISearchDraftStore } from "@/components/custom/search/search-draft-store";
import { IScannedCode } from "@/typings/scanned-code";

export interface ISearchBarProps extends ISearchBarFieldOptions {
  searchRoute: string;
  autoSearch?: boolean;
  disabled?: boolean;
  submitButtonLocation?: "none" | "auto" | "block";
  submitLabel?: string;
  /** Names the form, so an owner can put the submit button outside it */
  formId?: string;
  /** The draft this field mirrors with others; left out, it keeps its own */
  draftStore?: ISearchDraftStore;
  /** Updates `q` in place, without a server render, keeping the hash */
  shallow?: boolean;
  /** Offers searches to run under the field, from what is on this device */
  suggestions?: boolean;
  /** Fires once a search or a scan has navigated away */
  onSubmitted?: (query: string) => void;
}

export default function SearchBar({
  searchRoute,
  submitButtonLocation = "auto",
  autoSearch = false,
  disabled = false,
  submitLabel: submitLabelProp,
  formId,
  draftStore,
  suggestions = false,
  onSubmitted,
  shallow = false,
  ...field
}: ISearchBarProps) {
  const t = useTranslations("shell");
  const submitLabel = submitLabelProp ?? t("search.submit");
  const { routeQuery, isUnchanged, search, syncQuery, openResult } =
    useSearchNavigation(searchRoute, { shallow });
  const { setOpen } = useSidebar();
  const { registration, handleSubmit, clearQuery, markSubmitted, queryValue } =
    useSearchBarQuery({
      routeQuery,
      autoSearch,
      disabled,
      syncQuery,
      draftStore,
    });

  function submit(data: { query: string }) {
    if (disabled) return;

    const typed = data.query ?? "";
    const query = typed.trim();

    dismissTouchKeyboard();

    // Only a field emptied over a searched page has anything to do: it drops the query.
    if (!query && (typed || !routeQuery)) return;

    setOpen(false);
    markSubmitted(query);
    search(query);
    onSubmitted?.(query);
  }

  // formId means the owner renders the search button outside the form.
  const hasSearchButton = submitButtonLocation !== "none" || Boolean(formId);

  // An unchanged query never searches, so touch Enter only closes the keyboard.
  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    // Enter on the clear or scan button is that button's own click.
    if (!(event.target instanceof HTMLInputElement)) return;

    // Implicit submit needs a single field, and the suggestion list adds a hidden one.
    if (suggestions && !hasSearchButton) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
      return;
    }

    if (!hasSearchButton || !isUnchanged(queryValue)) return;
    if (!isTouchPointer()) return;

    event.preventDefault();
    dismissTouchKeyboard();
  }

  function handleClear() {
    clearQuery();

    // A live filter's own sync drops the query, and a field off its route has none to drop.
    if (!autoSearch && routeQuery) search("");
  }

  const handleScan = useCallback(
    (code: IScannedCode) => {
      dismissTouchKeyboard();
      setOpen(false);
      openResult(code.rawValue);
      onSubmitted?.(code.rawValue);
    },
    [openResult, setOpen, onSubmitted],
  );

  return (
    <div>
      <form
        id={formId}
        onSubmit={handleSubmit(submit)}
        onKeyDown={handleKeyDown}
        className="relative flex items-center gap-4 flex-wrap"
      >
        <SearchBarField
          {...field}
          registration={registration}
          queryValue={queryValue}
          disabled={disabled}
          onClear={handleClear}
          onScanned={handleScan}
          onPickSuggestion={
            suggestions ? (query) => submit({ query }) : undefined
          }
        />

        {submitButtonLocation !== "none" && (
          <SearchActionButton
            label={submitLabel}
            block={submitButtonLocation === "block"}
            isUnchanged={isUnchanged(queryValue)}
            disabled={disabled}
          />
        )}
      </form>
    </div>
  );
}
