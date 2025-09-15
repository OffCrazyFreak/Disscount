"use client";

import React, { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Search, ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useScanner } from "@/components/custom/scanner-context";
import { useSidebar } from "@/components/ui/sidebar";

interface SearchBarProps {
  placeholder?: string;
  searchRoute: string;
  clearable?: boolean;
  autoSearch?: boolean;
  allowScanning?: boolean;
  submitButtonLocation?: "None" | "Inline" | "Block";
  submitLabel?: string;
}

export default function SearchBar({
  placeholder = "Pretraži...",
  searchRoute,
  clearable = true,
  submitButtonLocation = "Block",
  autoSearch = false,
  allowScanning = false,
  submitLabel = "Pretraži",
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Only get initial query if current pathname matches searchRoute
  // Decode the URL parameter to get the original user input
  const initialQuery =
    pathname === searchRoute
      ? decodeURIComponent(searchParams.get("q") || "")
      : "";

  const { openScanner } = useScanner();
  const { setOpen } = useSidebar();

  const router = useRouter();

  const { register, handleSubmit, watch, reset, setValue } = useForm<{
    query: string;
  }>({
    defaultValues: { query: initialQuery },
  });

  const queryValue = watch("query");

  useEffect(() => {
    setValue("query", initialQuery);
  }, [initialQuery, setValue]);

  // Auto search for pages that filter in state
  useEffect(() => {
    if (autoSearch) {
      const query = queryValue ?? "";
      // For auto search, update the URL with the original query (preserving user input)
      if (!query) {
        router.replace(searchRoute);
      } else {
        router.replace(`${searchRoute}?q=${encodeURIComponent(query)}`);
      }
    }
  }, [queryValue, autoSearch, searchRoute, router]);

  function submit(data: { query: string }) {
    const q = data.query?.trim() ?? "";

    // Navigate to specified route with original query (preserving user input)
    if (!q) {
      router.replace(searchRoute);
    } else {
      router.replace(`${searchRoute}?q=${encodeURIComponent(q)}`);
    }
  }

  function handleClear() {
    reset({ query: "" });
    router.replace(searchRoute);
  }

  const handleScan = useCallback(
    (result: string) => {
      router.push(`${searchRoute}/${encodeURIComponent(result)}`);
      setOpen(false);
    },
    [setValue, searchRoute, router, setOpen]
  );

  return (
    <div>
      <form
        onSubmit={handleSubmit(submit)}
        className="relative max-w-3xl mx-auto"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
          <Input
            {...register("query")}
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-14 py-6 text-gray-500 focus:text-gray-700 bg-white"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Trigger react-hook-form submit
                void handleSubmit(submit)();
              }
            }}
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

        {submitButtonLocation !== "None" && (
          <div className="mt-4">
            <Button
              type="submit"
              size="lg"
              className="cursor-pointer w-full text-lg py-6 bg-primary hover:bg-secondary"
              disabled={!queryValue?.trim()}
            >
              <Search className="size-5 mr-2" />
              {submitLabel}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
