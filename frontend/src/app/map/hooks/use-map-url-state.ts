"use client";

import { useSearchParams } from "next/navigation";

export const ALL_CHAINS = "all" as const;

type HistoryMode = "push" | "replace";

/**
 * Writes the map's URL without a server round trip. Next keeps useSearchParams
 * in sync with the History API, and the hash the map writes for its view is
 * carried along untouched.
 */
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

/**
 * The map's shareable state. A selected store is pushed, so Back closes it; a
 * chain filter replaces, so toggling chips does not flood the history.
 */
export function useMapUrlState() {
  const searchParams = useSearchParams();

  const selectedKey = searchParams.get("store");
  const chainParam = searchParams.get("chain");
  const query = searchParams.get("q") ?? "";

  /** Null until the user picks chains, so defaults (pinned chains) can apply. */
  const chainFilter =
    chainParam == null
      ? null
      : chainParam === ALL_CHAINS
        ? ALL_CHAINS
        : chainParam.split(",").filter(Boolean);

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

  return { selectedKey, chainFilter, query, selectStore, setChainFilter };
}
