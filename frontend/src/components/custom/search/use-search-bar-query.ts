"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createSearchDraftStore,
  useSearchDraftValue,
  type ISearchDraftStore,
} from "@/components/custom/search/search-draft-store";

interface IUseSearchBarQueryOptions {
  routeQuery: string;
  autoSearch: boolean;
  disabled: boolean;
  syncQuery: (query: string) => void;
  /** Shared with the other fields it mirrors; left out, the field keeps its own */
  draftStore?: ISearchDraftStore;
}

export function useSearchBarQuery({
  routeQuery,
  autoSearch,
  disabled,
  syncQuery,
  draftStore,
}: IUseSearchBarQueryOptions) {
  const [ownDraft] = useState(createSearchDraftStore);
  const draft = draftStore ?? ownDraft;
  const queryValue = useSearchDraftValue(draft, routeQuery);
  const { register, handleSubmit, setValue, getValues } = useForm<{
    query: string;
  }>({
    defaultValues: { query: queryValue },
  });

  useEffect(() => {
    draft.followRoute(routeQuery);
  }, [draft, routeQuery]);

  useEffect(() => {
    if (getValues("query") !== queryValue) {
      setValue("query", queryValue, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [queryValue, setValue, getValues]);

  useEffect(() => {
    if (!autoSearch || disabled) return;

    // Nothing to mirror; this also stops a bar off its own route from redirecting there.
    if (!queryValue && !routeQuery) return;

    // A route change just replaced the draft, so this stale value would overwrite the entry Back reached.
    if (queryValue !== (draft.getTyped() ?? routeQuery)) return;
    if (queryValue === routeQuery) return;

    draft.navigatingTo(queryValue);
    syncQuery(queryValue);
  }, [autoSearch, disabled, draft, queryValue, routeQuery, syncQuery]);

  // Never reset() the form: it drops the registration, and the compiler memoizes register(), leaving the field dead.
  const registration = register("query", {
    onChange: (event) => draft.type(event.target.value),
  });

  return {
    registration,
    handleSubmit,
    clearQuery: draft.clear,
    markSubmitted: draft.navigatingTo,
    queryValue,
  };
}
