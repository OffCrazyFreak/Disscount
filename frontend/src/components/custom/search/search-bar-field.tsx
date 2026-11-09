"use client";

import type { RefObject } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import SearchBarActions from "@/components/custom/search/search-bar-actions";
import SearchSuggestions from "@/components/custom/search/search-suggestions";
import { useCameraScanner } from "@/context/scanner-context";
import { useSearchInputProps } from "@/components/custom/search/use-search-input-props";
import { IScannedCode } from "@/typings/scanned-code";

export interface ISearchBarFieldOptions {
  placeholder?: string;
  /** Shown instead of the placeholder when the field is too narrow for all of it */
  shortPlaceholder?: string;
  /** Names the field when a shortened placeholder would say too little */
  ariaLabel?: string;
  allowScanning?: boolean;
  /** Exposes the field so an owner can focus it inside a gesture's own task */
  inputRef?: RefObject<HTMLInputElement | null>;
}

interface ISearchBarFieldProps extends ISearchBarFieldOptions {
  registration: UseFormRegisterReturn<"query">;
  queryValue: string;
  disabled: boolean;
  onClear: () => void;
  onScanned: (code: IScannedCode) => void;
  /** Offers searches to run under the field, and receives the one picked */
  onPickSuggestion?: (query: string) => void;
}

export default function SearchBarField({
  placeholder,
  shortPlaceholder,
  ariaLabel,
  allowScanning = false,
  inputRef: exposedInputRef,
  registration,
  queryValue,
  disabled,
  onClear,
  onScanned,
  onPickSuggestion,
}: ISearchBarFieldProps) {
  const { openScanner } = useCameraScanner();
  const { inputRef, inputProps } = useSearchInputProps({
    placeholder,
    shortPlaceholder,
    ariaLabel,
    exposedInputRef,
    registration,
  });

  function handleClear() {
    onClear();
    inputRef.current?.focus();
  }

  const input = (
    <Input
      {...inputProps}
      // A combobox role is not allowed on type="search", and its list is why it has one.
      type={onPickSuggestion ? "text" : "search"}
      inputMode="search"
      enterKeyHint="search"
      disabled={disabled}
      size="lg"
      className="pl-10 pr-22 text-muted-foreground focus:text-foreground bg-popover [&::-webkit-search-cancel-button]:hidden"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );

  return (
    <div data-slot="search-field" className="relative grow-100">
      <Search
        aria-hidden="true"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5"
      />

      {onPickSuggestion ? (
        <SearchSuggestions
          query={queryValue}
          input={input}
          onPick={onPickSuggestion}
        />
      ) : (
        input
      )}

      <SearchBarActions
        showClear={Boolean(!disabled && queryValue)}
        onClear={handleClear}
        allowScanning={!disabled && allowScanning}
        onScan={(event) =>
          openScanner({ onScan: onScanned, opener: event.currentTarget })
        }
      />
    </div>
  );
}
