"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useForm } from "react-hook-form";
import { useSidebar } from "@/components/ui/sidebar";
import { useCameraScanner } from "@/context/scanner-context";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import type { IScannedCode } from "@/typings/scanned-code";

interface IUseSearchBarFormOptions {
  searchRoute: string;
  autoSearch: boolean;
  fieldRef?: RefObject<HTMLInputElement | null>;
  onQueryChange?: (query: string) => void;
}

/**
 * The field's whole behaviour: the form, the mirror of the route's own query,
 * the optional live sync, clearing and scanning. Extracted so the component that
 * renders the field stays presentational.
 */
export default function useSearchBarForm({
  searchRoute,
  autoSearch,
  fieldRef,
  onQueryChange,
}: IUseSearchBarFormOptions) {
  const { routeQuery, isUnchanged, search, syncQuery, openResult } =
    useSearchNavigation(searchRoute);
  const { openScanner } = useCameraScanner();
  const { setOpen } = useSidebar();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, watch, reset, setValue, getValues } =
    useForm<{
      query: string;
    }>({ defaultValues: { query: routeQuery } });

  const queryValue = watch("query") ?? "";
  const { ref: registerRef, ...fieldProps } = register("query");

  useEffect(() => {
    if (getValues("query") === routeQuery) return;

    setValue("query", routeQuery, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [routeQuery, setValue, getValues]);

  // Watched rather than hooked to onChange, so a clear or a route sync counts too.
  useEffect(() => {
    onQueryChange?.(queryValue);
  }, [queryValue, onQueryChange]);

  useEffect(() => {
    if (!autoSearch) return;

    // An empty field over an empty URL has nothing to mirror; this also stops a
    // bar mounted off its own route from redirecting there.
    if (!queryValue && !routeQuery) return;

    syncQuery(queryValue);
  }, [autoSearch, queryValue, routeQuery, syncQuery]);

  function setFieldRef(element: HTMLInputElement | null) {
    inputRef.current = element;
    if (fieldRef) fieldRef.current = element;

    registerRef(element);
  }

  const onSubmit = handleSubmit((values) => {
    setOpen(false);
    search(values.query?.trim() ?? "");
  });

  function clear() {
    reset({ query: "" });
    search("");
    inputRef.current?.focus();
  }

  const scan = useCallback(() => {
    openScanner({
      onScan: (code: IScannedCode) => {
        setOpen(false);
        openResult(code.rawValue);
      },
    });
  }, [openScanner, openResult, setOpen]);

  return {
    fieldProps,
    setFieldRef,
    queryValue,
    isUnchanged,
    onSubmit,
    clear,
    scan,
  };
}
