"use client";

import { usePathname } from "@/i18n/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import NoResults from "@/components/custom/common/no-results";
import { AnimatedGroup } from "@/components/custom/animation/animated-group";
import SuggestionCard from "@/app/[locale]/suggestions/components/suggestion-card";
import { templateSuggestions } from "@/app/[locale]/suggestions/suggestions";
import { filterByFields } from "@/utils/generic";

interface ISuggestionsClientProps {
  query: string;
}

export default function SuggestionsClient({ query }: ISuggestionsClientProps) {
  const t = useTranslations("suggestions");
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
            ? t("searchHeading", { query, count: matchingSuggestions.length })
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
