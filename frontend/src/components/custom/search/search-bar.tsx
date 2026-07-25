"use client";

import type { RefObject } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SearchBarActions from "@/components/custom/search/search-bar-actions";
import SearchSubmitButton from "@/components/custom/search/search-submit-button";
import useSearchBarForm from "@/components/custom/search/use-search-bar-form";

interface ISearchBarProps {
  placeholder?: string;
  searchRoute: string;
  clearable?: boolean;
  autoSearch?: boolean;
  allowScanning?: boolean;
  submitButtonLocation?: "none" | "auto" | "block";
  submitLabel?: string;
  /** Names the form, so a submit button outside it can still own it */
  formId?: string;
  fieldRef?: RefObject<HTMLInputElement | null>;
  onQueryChange?: (query: string) => void;
}

export default function SearchBar({
  placeholder = "Pretraži...",
  searchRoute,
  clearable = true,
  submitButtonLocation = "auto",
  autoSearch = false,
  allowScanning = false,
  submitLabel = "Pretraži",
  formId,
  fieldRef,
  onQueryChange,
}: ISearchBarProps) {
  const {
    fieldProps,
    setFieldRef,
    queryValue,
    isUnchanged,
    onSubmit,
    clear,
    scan,
  } = useSearchBarForm({ searchRoute, autoSearch, fieldRef, onQueryChange });

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="relative flex flex-wrap items-center gap-4"
    >
      <div className="relative grow-100">
        <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />

        <Input
          ref={setFieldRef}
          {...fieldProps}
          type="text"
          placeholder={placeholder}
          aria-label={placeholder}
          className="bg-white py-6 pr-22 pl-10 text-gray-500 focus:text-gray-700"
          autoComplete="off"
        />

        <SearchBarActions
          showClear={Boolean(clearable && queryValue)}
          onClear={clear}
          allowScanning={allowScanning}
          onScan={scan}
        />
      </div>

      {submitButtonLocation !== "none" && (
        <SearchSubmitButton
          label={submitLabel}
          block={submitButtonLocation === "block"}
          disabled={isUnchanged(queryValue)}
        />
      )}
    </form>
  );
}
