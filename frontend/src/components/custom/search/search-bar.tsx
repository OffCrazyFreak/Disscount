"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import SearchBarField, {
  type ISearchBarFieldOptions,
} from "@/components/custom/search/search-bar-field";
import SearchActionButton from "@/components/custom/search/search-action-button";
import { useSearchBarQuery } from "@/components/custom/search/use-search-bar-query";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { IScannedCode } from "@/typings/scanned-code";

interface ISearchBarProps extends ISearchBarFieldOptions {
  searchRoute: string;
  autoSearch?: boolean;
  disabled?: boolean;
  submitButtonLocation?: "none" | "auto" | "block";
  submitLabel?: string;
  /** Names the form, so an owner can put the submit button outside it */
  formId?: string;
  /** Mirrors what is typed, for an owner rendering the submit button itself */
  onQueryChange?: (query: string) => void;
  /** Updates `q` in place, without a server render, keeping the hash */
  shallow?: boolean;
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
  onQueryChange,
  onSubmitted,
  shallow = false,
  ...field
}: ISearchBarProps) {
  const t = useTranslations("shell");
  const submitLabel = submitLabelProp ?? t("search.submit");
  const { routeQuery, isUnchanged, search, syncQuery, openResult } =
    useSearchNavigation(searchRoute, { shallow });
  const { setOpen } = useSidebar();
  const { register, handleSubmit, reset, queryValue } = useSearchBarQuery({
    routeQuery,
    autoSearch,
    disabled,
    syncQuery,
    onQueryChange,
  });

  function submit(data: { query: string }) {
    if (disabled) return;

    const query = data.query?.trim() ?? "";

    setOpen(false);
    search(query);
    onSubmitted?.(query);
  }

  function handleClear() {
    reset({ query: "" });
    search("");
  }

  const handleScan = useCallback(
    (code: IScannedCode) => {
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
        className="relative flex items-center gap-4 flex-wrap"
      >
        <SearchBarField
          {...field}
          registration={register("query")}
          queryValue={queryValue}
          disabled={disabled}
          onClear={handleClear}
          onScanned={handleScan}
        />

        {submitButtonLocation !== "none" && (
          <SearchActionButton
            label={submitLabel}
            block={submitButtonLocation === "block"}
            isUnchanged={isUnchanged(queryValue ?? "")}
            disabled={disabled}
          />
        )}
      </form>
    </div>
  );
}
