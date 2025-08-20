"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Search, ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeForSearch } from "@/lib/utils";

export interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onBarcodeClick?: () => void;
  showBarcode?: boolean;
  clearable?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
}

export default function SearchBar({
  defaultValue = "",
  placeholder = "Search...",
  onSearch,
  onBarcodeClick,
  showBarcode = true,
  clearable = true,
  showSubmitButton = false,
  submitLabel = "Search",
}: SearchBarProps) {
  const { register, handleSubmit, watch, reset, setValue } = useForm<{
    query: string;
  }>({
    defaultValues: { query: defaultValue },
  });

  const queryValue = watch("query");

  useEffect(() => {
    setValue("query", defaultValue);
  }, [defaultValue, setValue]);

  function submit(data: { query: string }) {
    const q = data.query?.trim() ?? "";
    onSearch?.(q);
  }

  function handleClear() {
    reset({ query: "" });
    onSearch?.("");
  }

  return (
    <div className="">
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
            className="pl-10 pr-14 py-6 text-lg bg-white"
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

            {showBarcode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBarcodeClick}
                className="p-2"
                title="Scan barcode"
              >
                <ScanBarcode className="size-5" />
              </Button>
            )}
          </div>
        </div>

        {showSubmitButton && (
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
