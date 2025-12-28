"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { Search, ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCameraScanner } from "@/context/scanner-context";
import { useSidebar } from "@/components/ui/sidebar";

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
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Only get initial query if current pathname matches searchRoute
  // Decode the URL parameter to get the original user input
  const matchesRoute =
    pathname.replace(/\/$/, "") === searchRoute.replace(/\/$/, "");
  const initialQuery = matchesRoute
    ? decodeURIComponent(searchParams.get("q") || "")
    : "";

  const { openScanner } = useCameraScanner();
  const { setOpen } = useSidebar();

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, reset, setValue, getValues } =
    useForm<{
      query: string;
    }>({
      defaultValues: { query: initialQuery },
    });

  const queryValue = watch("query");

  const { ref: registerRef, ...registerProps } = register("query");

  useEffect(() => {
    if (getValues("query") !== initialQuery) {
      setValue("query", initialQuery, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [initialQuery, setValue, getValues]);

  // Auto search for pages that filter in state
  useEffect(() => {
    if (autoSearch) {
      const query = queryValue ?? "";
      // For auto search, update the URL with the original query (preserving user input)
      if (!query) {
        router.push(searchRoute);
      } else {
        router.replace(`${searchRoute}?q=${encodeURIComponent(query)}`);
      }
    }
  }, [queryValue, autoSearch, searchRoute, router]);

  function submit(data: { query: string }) {
    const query = data.query?.trim() ?? "";
    setOpen(false);

    if (!query) {
      router.push(searchRoute);
    } else {
      router.push(`${searchRoute}?q=${encodeURIComponent(query)}`);
    }
  }

  function handleClear() {
    reset({ query: "" });
    router.push(searchRoute);
    inputRef.current?.focus();
  }

  const handleScan = useCallback(
    (result: string) => {
      router.push(`${searchRoute}/${encodeURIComponent(result)}`);
      setOpen(false);
    },
    [searchRoute, router, setOpen]
  );
  return (
    <div>
      <form
        onSubmit={handleSubmit(submit)}
        className="relative max-w-3xl mx-auto flex items-center gap-4 flex-wrap"
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
            className="pl-10 pr-14 py-6 text-gray-500 focus:text-gray-700 bg-white"
            autoComplete="off"
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {clearable && queryValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X />
              </Button>
            )}

            {allowScanning && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openScanner(handleScan)}
                className="p-2"
                title="Scan barcode"
              >
                <ScanBarcode className="size-5" />
              </Button>
            )}
          </div>
        </div>

        {submitButtonLocation !== "none" && (
          <Button
            type="submit"
            size="lg"
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
