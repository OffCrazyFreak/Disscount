"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import NoResults from "@/components/custom/no-results";
import { AnimatedGroup } from "@/components/ui/animated-group";
import SuggestionCard from "@/app/suggestions/components/suggestion-card";
import { templateSuggestions } from "@/app/suggestions/suggestions";
import { filterByFields } from "@/utils/generic";

export default function SuggestionsClient({ query }: { query: string }) {
  const pathname = usePathname();

  const matchingSuggestions = filterByFields(templateSuggestions, query, [
    "title",
    "description",
  ]);

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder="Pretraži ideje i prijedloge..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${matchingSuggestions.length})`
            : `Ideje i prijedlozi (${matchingSuggestions.length})`}
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
