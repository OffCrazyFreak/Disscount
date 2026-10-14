"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

interface IUseSearchBarQueryOptions {
  routeQuery: string;
  autoSearch: boolean;
  disabled: boolean;
  syncQuery: (query: string) => void;
  onQueryChange?: (query: string) => void;
}

/** The search field's form, kept in step with the URL's `q` both ways. */
export function useSearchBarQuery({
  routeQuery,
  autoSearch,
  disabled,
  syncQuery,
  onQueryChange,
}: IUseSearchBarQueryOptions) {
  const { register, handleSubmit, control, reset, setValue, getValues } =
    useForm<{
      query: string;
    }>({
      defaultValues: { query: routeQuery },
    });

  // useWatch, not form.watch: watch() signals changes outside React state, so the
  // React Compiler skips memoizing every component that reads it.
  const queryValue = useWatch({
    control,
    name: "query",
    defaultValue: routeQuery,
  });

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
    if (!autoSearch || disabled) return;

    const query = queryValue ?? "";

    // An empty input over an empty URL has nothing to mirror; this also stops a
    // bar mounted off its own route from redirecting there.
    if (!query && !routeQuery) return;

    syncQuery(query);
  }, [autoSearch, disabled, queryValue, routeQuery, syncQuery]);

  return { register, handleSubmit, reset, queryValue };
}
