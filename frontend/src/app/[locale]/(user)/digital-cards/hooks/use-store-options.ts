import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type {
  IStoreGroup,
  IStoreOption,
} from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/store-option-types";
import { useListChains } from "@/lib/cijene-api";
import { storeNameService } from "@/lib/api";
import { getChainLabel } from "@/utils/labels";
import { normalizeForSearch } from "@/utils/strings";

const SUGGESTION_DEBOUNCE_MS = 250;

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/** Autocomplete groups for the typed text: official chains, community names, then an "add" row. */
export function useStoreOptions(query: string): IStoreGroup[] {
  const t = useTranslations("digitalCards.form");
  const locale = useLocale();
  const typed = query.trim();
  const needle = normalizeForSearch(typed);

  const chainsQuery = useListChains();
  const communityQuery = storeNameService.useSearchStoreNames(
    useDebouncedValue(typed, SUGGESTION_DEBOUNCE_MS),
  );

  const chainOptions: IStoreOption[] = (chainsQuery.data?.chains ?? [])
    .map((code) => ({
      value: code,
      label: getChainLabel(code),
      chainCode: code,
    }))
    .filter((option) => normalizeForSearch(option.label).includes(needle))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  const chainLabels = new Set(
    (chainsQuery.data?.chains ?? []).map((code) =>
      normalizeForSearch(getChainLabel(code)),
    ),
  );

  // A community name that spells an official chain would hide the logo row it duplicates.
  const communityOptions: IStoreOption[] = (communityQuery.data ?? [])
    .filter(
      (suggestion) =>
        !chainLabels.has(normalizeForSearch(suggestion.name)) &&
        normalizeForSearch(suggestion.name).includes(needle),
    )
    .map((suggestion) => ({ value: suggestion.name, label: suggestion.name }));

  const groups: IStoreGroup[] = [
    { value: t("storeGroupOfficial"), items: chainOptions },
    { value: t("storeGroupOther"), items: communityOptions },
  ].filter((group) => group.items.length > 0);

  const alreadyListed = [...chainOptions, ...communityOptions].some(
    (option) => normalizeForSearch(option.label) === needle,
  );

  if (typed && !alreadyListed) {
    groups.push({
      value: "",
      items: [{ value: typed, label: typed, custom: true }],
    });
  }

  return groups;
}
