"use client";

import { useEffect, useRef } from "react";
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
  const { register, handleSubmit, control, setValue, getValues } = useForm<{
    query: string;
  }>({
    defaultValues: { query: routeQuery },
  });
  const isClearOnItsWay = useRef(false);

  // useWatch, not form.watch: watch() signals changes outside React state, so the
  // React Compiler skips memoizing every component that reads it.
  const queryValue = useWatch({
    control,
    name: "query",
    defaultValue: routeQuery,
  });

  useEffect(() => {
    const isEchoOfClear = isClearOnItsWay.current && !routeQuery;
    isClearOnItsWay.current = false;

    // The URL follows a clear in a transition: echoing it would wipe what was typed since.
    if (isEchoOfClear) return;

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

  // Never reset(): it drops the input's registration, and the compiler memoizes
  // register() so the input never registers again, leaving the field dead.
  function clearQuery() {
    isClearOnItsWay.current = Boolean(routeQuery);
    setValue("query", "");
  }

  return { register, handleSubmit, clearQuery, queryValue };
}
