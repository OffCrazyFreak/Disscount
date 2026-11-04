"use client";

import { useSearchParams } from "next/navigation";

import {
  type OpenFilter,
  openFilterOf,
  openParamOf,
} from "@/app/[locale]/map/utils/open-filter";

export const ALL_CHAINS = "all" as const;

type HistoryMode = "push" | "replace";

/** Next keeps useSearchParams in sync with the History API, so no server round trip, and the view hash is carried along untouched. */
function writeParams(
  mutate: (params: URLSearchParams) => void,
  mode: HistoryMode,
) {
  const params = new URLSearchParams(window.location.search);
  mutate(params);

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

/** A selected store is pushed, so Back closes it; a chain filter replaces, so toggling chips does not flood the history. */
export function useMapUrlState() {
  const searchParams = useSearchParams();

  const selectedKey = searchParams.get("store");
  const chainParam = searchParams.get("chain");
  const query = searchParams.get("q") ?? "";
  const openFilter = openFilterOf(searchParams.get("open"));

  const picked = chainParam?.split(",").filter(Boolean) ?? [];

  /** Null until the user picks chains, so pinned defaults can apply; an empty list means every chain, matching the multiselect's empty state. */
  const chainFilter =
    chainParam == null
      ? null
      : chainParam === ALL_CHAINS || picked.length === 0
        ? ALL_CHAINS
        : picked;

  function selectStore(key: string | null) {
    if (key === selectedKey) return;

    writeParams(
      (params) => {
        if (key) params.set("store", key);
        else params.delete("store");
      },
      key ? "push" : "replace",
    );
  }

  function setChainFilter(chains: string[] | typeof ALL_CHAINS) {
    writeParams((params) => {
      params.set(
        "chain",
        chains === ALL_CHAINS ? ALL_CHAINS : chains.join(","),
      );
    }, "replace");
  }

  function setOpenFilter(filter: OpenFilter) {
    writeParams((params) => {
      const value = openParamOf(filter);

      if (value) params.set("open", value);
      else params.delete("open");
    }, "replace");
  }

  return {
    selectedKey,
    chainFilter,
    query,
    openFilter,
    selectStore,
    setChainFilter,
    setOpenFilter,
  };
}
