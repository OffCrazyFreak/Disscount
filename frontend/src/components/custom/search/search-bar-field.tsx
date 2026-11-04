"use client";

import { useRef, type RefObject } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import SearchBarActions from "@/components/custom/search/search-bar-actions";
import { useCameraScanner } from "@/context/scanner-context";
import { useFittingText } from "@/hooks/use-fitting-text";
import { IScannedCode } from "@/typings/scanned-code";

export interface ISearchBarFieldOptions {
  placeholder?: string;
  /** Shown instead of the placeholder when the field is too narrow for all of it */
  shortPlaceholder?: string;
  /** Names the field when a shortened placeholder would say too little */
  ariaLabel?: string;
  clearable?: boolean;
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
}

/** The search input with its icon and the clear and scan buttons. */
export default function SearchBarField({
  placeholder: placeholderProp,
  shortPlaceholder,
  ariaLabel,
  clearable = true,
  allowScanning = false,
  inputRef: exposedInputRef,
  registration,
  queryValue,
  disabled,
  onClear,
  onScanned,
}: ISearchBarFieldProps) {
  const t = useTranslations("shell");
  const { openScanner } = useCameraScanner();
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = useFittingText(
    inputRef,
    placeholderProp ?? t("search.placeholder"),
    shortPlaceholder,
  );
  const { ref: registerRef, ...registerProps } = registration;

  function handleClear() {
    onClear();
    inputRef.current?.focus();
  }

  return (
    <div className="relative grow-100">
      <Search
        aria-hidden="true"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5"
      />

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
        aria-label={ariaLabel || placeholder || t("search.submit")}
        disabled={disabled}
        size="lg"
        className="pl-10 pr-22 text-muted-foreground focus:text-foreground bg-popover [&::-webkit-search-cancel-button]:hidden"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <SearchBarActions
        showClear={Boolean(!disabled && clearable && queryValue)}
        onClear={handleClear}
        allowScanning={!disabled && allowScanning}
        onScan={() => openScanner({ onScan: onScanned })}
      />
    </div>
  );
}
