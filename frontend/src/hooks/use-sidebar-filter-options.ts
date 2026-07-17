"use client";

import { useMemo } from "react";
import cijeneService from "@/lib/cijene-api";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { storeNamesMap } from "@/constants/name-mappings";
import type { ISidebarFilterOption } from "@/components/custom/sidebar-filter-menu";

function byLabel(a: ISidebarFilterOption, b: ISidebarFilterOption): number {
  return a.label.localeCompare(b.label, "hr", { sensitivity: "base" });
}

/** Store chain and city options for the sidebar's products filter menus */
export function useSidebarFilterOptions() {
  const { data: chainStats } = cijeneService.useGetChainStats();
  const { data: locations } = useAllLocations();

  const chains = useMemo<ISidebarFilterOption[]>(
    () =>
      (chainStats?.chain_stats ?? [])
        .map((chain) => ({
          value: chain.chain_code,
          label: storeNamesMap[chain.chain_code] || chain.chain_code,
          count: chain.store_count,
        }))
        .sort(byLabel),
    [chainStats],
  );

  const cities = useMemo<ISidebarFilterOption[]>(
    () =>
      (locations ?? [])
        .map((location) => ({
          value: location.name,
          label: location.name,
          count: location.storeCount,
        }))
        .sort(byLabel),
    [locations],
  );

  return { chains, cities };
}
