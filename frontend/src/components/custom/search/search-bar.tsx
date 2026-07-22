"use client";

import { useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchBarActions from "@/components/custom/search/search-bar-actions";
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
}

export default function SearchBar({
  placeholder = "Pretraži...",
  searchRoute,
  clearable = true,
  submitButtonLocation = "auto",
  autoSearch = false,
  allowScanning = false,
  submitLabel = "Pretraži",
}: ISearchBarProps) {
  const { routeQuery, search, syncQuery, openResult } =
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

  useEffect(() => {
    if (!autoSearch) return;

    const query = queryValue ?? "";

    // An empty input over an empty URL has nothing to mirror. Skipping it also
    // keeps a bar mounted off its own route from redirecting there on mount.
    if (!query && !routeQuery) return;

    syncQuery(query);
  }, [autoSearch, queryValue, routeQuery, syncQuery]);

  function submit(data: { query: string }) {
    setOpen(false);
    search(data.query?.trim() ?? "");
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
    },
    [openResult, setOpen],
  );

  return (
    <div>
      <form
        onSubmit={handleSubmit(submit)}
        className="relative flex items-center gap-4 flex-wrap"
      >
        <div className="relative grow-100">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />

          <Input
            ref={(el) => {
              inputRef.current = el;
              registerRef(el);
            }}
            {...registerProps}
            type="text"
            placeholder={placeholder}
            aria-label={placeholder}
            className="pl-10 pr-22 py-6 text-gray-500 focus:text-gray-700 bg-white"
            autoComplete="off"
          />

          <SearchBarActions
            showClear={Boolean(clearable && queryValue)}
            onClear={handleClear}
            allowScanning={allowScanning}
            onScan={() => openScanner({ onScan: handleScan })}
          />
        </div>

        {submitButtonLocation !== "none" && (
          <Button
            type="submit"
            size="lg"
            effect="shineHover"
            className={`text-lg p-6 bg-primary hover:bg-secondary grow ${
              submitButtonLocation === "block" && "w-full"
            }`}
            disabled={!queryValue?.trim()}
          >
            <Search className="size-5 mr-2" />
            {submitLabel}
          </Button>
        )}
      </form>
    </div>
  );
}
