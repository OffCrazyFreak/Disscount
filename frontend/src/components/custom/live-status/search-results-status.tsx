"use client";

import { useTranslations } from "next-intl";

import DebouncedStatus from "@/components/custom/live-status/debounced-status";

interface ISearchResultsStatusProps {
  query: string;
  count: number;
  /** Silent while the data behind the count loads, so a half loaded page is never read as no results */
  isLoading?: boolean;
}

/** The search word is in the sentence, so two searches that settle on the same count are both read out. */
export default function SearchResultsStatus({
  query,
  count,
  isLoading = false,
}: ISearchResultsStatusProps) {
  const t = useTranslations("shell.search");
  const trimmedQuery = query.trim();

  const message =
    trimmedQuery && !isLoading
      ? t("resultsStatus", { count, query: trimmedQuery })
      : "";

  return <DebouncedStatus message={message} />;
}
