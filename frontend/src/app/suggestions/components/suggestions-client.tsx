"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import NoResults from "@/components/custom/no-results";
import { AnimatedGroup } from "@/components/ui/animated-group";
import SuggestionCard from "@/app/suggestions/components/suggestion-card";
import { templateSuggestions } from "@/app/suggestions/suggestions";
import { filterByFields } from "@/utils/generic";

export default function SuggestionsClient({ query }: { query: string }) {
  const t = useTranslations("pages.suggestions");
  const pathname = usePathname();

  const matchingSuggestions = filterByFields(templateSuggestions, query, [
    "title",
    "description",
  ]);

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("searchPlaceholder")}
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? t("searchResults", {
                query,
                count: matchingSuggestions.length,
              })
            : t("heading", { count: matchingSuggestions.length })}
        </h3>
      </div>

      {matchingSuggestions.length > 0 ? (
        <AnimatedGroup className="space-y-4" preset="blur-slide">
          {matchingSuggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </AnimatedGroup>
      ) : (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      )}
    </div>
  );
}
