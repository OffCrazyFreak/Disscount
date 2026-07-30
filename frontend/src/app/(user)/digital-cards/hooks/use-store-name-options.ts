import { useMemo } from "react";

import cijeneService from "@/lib/cijene-api";
import { storeNameService } from "@/lib/api";
import { getChainLabel } from "@/utils/labels";
import { compareHr, normalizeForSearch } from "@/utils/strings";

export interface IStoreOption {
  /** The label shown and stored as storeName. */
  label: string;
  /** Set only for an official chain, which is what unlocks its logo and brand colour. */
  chainCode: string | null;
}

interface IUseStoreNameOptionsResult {
  officialOptions: IStoreOption[];
  suggestedOptions: IStoreOption[];
  isLoading: boolean;
}

export function useStoreNameOptions({
  enabled = true,
}: { enabled?: boolean } = {}): IUseStoreNameOptionsResult {
  // Chain stats are public and cached for six hours, so they carry no enabled gate.
  const chainsQuery = cijeneService.useGetChainStats();
  const suggestionsQuery = storeNameService.useGetStoreNameSuggestions({
    enabled,
  });

  const officialOptions = useMemo(() => {
    const chains = chainsQuery.data?.chain_stats ?? [];

    return chains
      .map((chain) => ({
        label: getChainLabel(chain.chain_code),
        chainCode: chain.chain_code,
      }))
      .sort((a, b) => compareHr(a.label, b.label));
  }, [chainsQuery.data]);

  const suggestedOptions = useMemo(() => {
    const officialKeys = new Set(
      officialOptions.map((option) => normalizeForSearch(option.label)),
    );

    // The backend already orders by popularity, but a name that has since become an
    // official chain would otherwise appear in both groups.
    return (suggestionsQuery.data ?? [])
      .filter((item) => !officialKeys.has(normalizeForSearch(item.name)))
      .map((item) => ({ label: item.name, chainCode: null }));
  }, [suggestionsQuery.data, officialOptions]);

  return {
    officialOptions,
    suggestedOptions,
    isLoading: chainsQuery.isLoading || suggestionsQuery.isLoading,
  };
}
