"use client";

import { History } from "lucide-react";
import { useTranslations } from "next-intl";

interface IRecentSearchesProps {
  searches: string[];
  onPick: (query: string) => void;
  onClear: () => void;
}

/** Last searches on this device, offered while the search field is empty. */
export default function RecentSearches({
  searches,
  onPick,
  onClear,
}: IRecentSearchesProps) {
  const t = useTranslations("map.recent");

  if (searches.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <History className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t("label")}</span>

      {searches.map((search) => (
        <button
          key={search}
          type="button"
          onClick={() => onPick(search)}
          className="rounded-full bg-muted px-3 py-1 hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
        >
          {search}
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        aria-label={t("clearLabel")}
        className="text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("clear")}
      </button>
    </div>
  );
}
