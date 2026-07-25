"use client";

import { useEffect, useCallback, useRef, type RefObject } from "react";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SearchBarActions from "@/components/custom/search/search-bar-actions";
import SearchSubmitButton from "@/components/custom/search/search-submit-button";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import { useCameraScanner } from "@/context/scanner-context";
import { useSidebar } from "@/components/ui/sidebar";
import { IScannedCode } from "@/typings/scanned-code";

interface ISearchBarProps {
  placeholder?: string;
  searchRoute: string;
  clearable?: boolean;
  autoSearch?: boolean;
  allowScanning?: boolean;
  submitButtonLocation?: "none" | "auto" | "block";
  submitLabel?: string;
  /** Names the form, so an owner can put the submit button outside it */
  formId?: string;
  /** Exposes the field so an owner can focus it inside a gesture's own task */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Mirrors what is typed, for an owner rendering the submit button itself */
  onQueryChange?: (query: string) => void;
  /** Fires once a search or a scan has navigated away */
  onSubmitted?: (query: string) => void;
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
  inputRef: exposedInputRef,
  onQueryChange,
  onSubmitted,
}: ISearchBarProps) {
  const { routeQuery, isUnchanged, search, syncQuery, openResult } =
    useSearchNavigation(searchRoute);
  const { openScanner } = useCameraScanner();
  const { setOpen } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, reset, setValue, getValues } =
    useForm<{
      query: string;
    }>({
      defaultValues: { query: routeQuery },
    });

  const queryValue = watch("query");
  const { ref: registerRef, ...registerProps } = register("query");

  useEffect(() => {
    if (getValues("query") !== routeQuery) {
      setValue("query", routeQuery, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [routeQuery, setValue, getValues]);

  // Watched rather than hooked to onChange, so a clear or a route sync counts too.
  useEffect(() => {
    onQueryChange?.(queryValue ?? "");
  }, [queryValue, onQueryChange]);

  useEffect(() => {
    if (!autoSearch) return;

    const query = queryValue ?? "";

    // An empty input over an empty URL has nothing to mirror; this also stops a
    // bar mounted off its own route from redirecting there.
    if (!query && !routeQuery) return;

    syncQuery(query);
  }, [autoSearch, queryValue, routeQuery, syncQuery]);

  function submit(data: { query: string }) {
    const query = data.query?.trim() ?? "";

    setOpen(false);
    search(query);
    onSubmitted?.(query);
  }

  function handleClear() {
    reset({ query: "" });
    search("");
    inputRef.current?.focus();
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
        <div className="relative grow-100">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />

          <Input
            ref={(el) => {
              inputRef.current = el;
              if (exposedInputRef) exposedInputRef.current = el;
              registerRef(el);
            }}
            {...registerProps}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder={placeholder}
            aria-label={placeholder || "Pretraži"}
            className="pl-10 pr-22 py-6 text-gray-500 focus:text-gray-700 bg-white [&::-webkit-search-cancel-button]:hidden"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <SearchBarActions
            showClear={Boolean(clearable && queryValue)}
            onClear={handleClear}
            allowScanning={allowScanning}
            onScan={() => openScanner({ onScan: handleScan })}
          />
        </div>

        {submitButtonLocation !== "none" && (
          <SearchSubmitButton
            label={submitLabel}
            block={submitButtonLocation === "block"}
            disabled={isUnchanged(queryValue ?? "")}
          />
        )}
      </form>
    </div>
  );
}
