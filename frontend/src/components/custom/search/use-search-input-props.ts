"use client";

import { useRef, type RefObject } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import { useFittingText } from "@/hooks/use-fitting-text";

interface IUseSearchInputPropsOptions {
  placeholder?: string;
  shortPlaceholder?: string;
  ariaLabel?: string;
  exposedInputRef?: RefObject<HTMLInputElement | null>;
  registration: UseFormRegisterReturn<"query">;
}

/** The search input's name, placeholder and refs, all three of which need its element. */
export function useSearchInputProps({
  placeholder: placeholderProp,
  shortPlaceholder,
  ariaLabel,
  exposedInputRef,
  registration,
}: IUseSearchInputPropsOptions) {
  const t = useTranslations("shell");
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = useFittingText(
    inputRef,
    placeholderProp ?? t("search.placeholder"),
    shortPlaceholder,
  );
  const { ref: registerRef, ...registerProps } = registration;

  return {
    inputRef,
    inputProps: {
      ...registerProps,
      ref: (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (exposedInputRef) exposedInputRef.current = el;
        registerRef(el);
      },
      placeholder,
      "aria-label": ariaLabel || placeholder || t("search.submit"),
    },
  };
}
