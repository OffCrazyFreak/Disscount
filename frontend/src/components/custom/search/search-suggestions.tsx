"use client";

import { useRef, useState, type ReactElement } from "react";
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { useQueryClient } from "@tanstack/react-query";
import { History, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteRow,
} from "@/components/reui/autocomplete";
import DebouncedStatus from "@/components/custom/live-status/debounced-status";
import { getCachedProductNames } from "@/lib/cijene-api/cached-product-names";
import { productRecentSearches } from "@/utils/browser/storage/recent-searches";
import {
  rankSearchSuggestions,
  type ISearchSuggestion,
} from "@/utils/search/search-suggestions";

type ICell = ISearchSuggestion | { kind: "remove"; text: string };

interface ISearchSuggestionsProps {
  query: string;
  /** The field itself, which stays focused while the list is open */
  input: ReactElement;
  onPick: (query: string) => void;
}

/** A list under the field of searches to run, built only from what is on this device. */
export default function SearchSuggestions({
  query,
  input,
  onPick,
}: ISearchSuggestionsProps) {
  const t = useTranslations("shell.search");
  const queryClient = useQueryClient();
  const recent = productRecentSearches.useSearches();
  const [isOpen, setIsOpen] = useState(false);
  const [productNames, setProductNames] = useState<string[]>([]);
  const isRemoving = useRef(false);

  const isBlank = !query.trim();
  const suggestions: ISearchSuggestion[] = isBlank
    ? recent.map((text) => ({ text, kind: "recent" }))
    : rankSearchSuggestions(query, recent, productNames);
  // Grid cells in reading order, because Base UI maps them to the rendered ones by position.
  const cells: ICell[] = suggestions.flatMap((suggestion): ICell[] =>
    suggestion.kind === "recent"
      ? [suggestion, { kind: "remove", text: suggestion.text }]
      : [suggestion],
  );
  const isShown = isOpen && suggestions.length > 0;

  function handleOpenChange(open: boolean) {
    // Pressing any cell closes the list, but removing one search leaves the rest to pick from.
    if (!open && isRemoving.current) {
      isRemoving.current = false;
      return;
    }

    // Once per opening, so a keystroke never walks the whole query cache.
    if (open) setProductNames(getCachedProductNames(queryClient));
    setIsOpen(open);
  }

  return (
    <>
      <Autocomplete
        grid
        items={cells}
        filter={null}
        itemToStringValue={(cell: ICell) => cell.text}
        value={query}
        open={isShown}
        onOpenChange={handleOpenChange}
        openOnInputClick
        // A pointer resting on a row must not turn Enter into picking it.
        highlightItemOnHover={false}
      >
        <AutocompletePrimitive.Input
          render={input}
          onFocus={() => handleOpenChange(true)}
          // Fields mirror one draft, so a list left open would rise under another's typing.
          onBlur={() => setIsOpen(false)}
        />

        <AutocompleteContent className="motion-reduce:transition-none">
          <AutocompleteList
            aria-label={isBlank ? t("recentSearches") : t("suggestions")}
          >
            {suggestions.map(({ text, kind }) => (
              <AutocompleteRow key={text} className="gap-1">
                <AutocompleteItem
                  value={{ text, kind }}
                  onClick={() => onPick(text)}
                  className="min-h-10 min-w-0 flex-1 cursor-pointer gap-2 hover:bg-accent"
                >
                  {kind === "recent" ? (
                    <History aria-hidden="true" />
                  ) : (
                    <Search aria-hidden="true" />
                  )}
                  <span lang="hr" className="line-clamp-2">
                    {text}
                  </span>
                </AutocompleteItem>

                {kind === "recent" && (
                  <AutocompleteItem
                    value={{ text, kind: "remove" }}
                    aria-label={t("removeRecent", { query: text })}
                    onClick={() => {
                      isRemoving.current = true;
                      productRecentSearches.remove(text);
                    }}
                    className="size-10 shrink-0 cursor-pointer justify-center hover:bg-accent"
                  >
                    <X aria-hidden="true" />
                  </AutocompleteItem>
                )}
              </AutocompleteRow>
            ))}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>

      <DebouncedStatus
        message={
          isShown ? t("suggestionCount", { count: suggestions.length }) : ""
        }
      />
    </>
  );
}
