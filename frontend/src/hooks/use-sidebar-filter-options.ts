"use client";

import { useMemo } from "react";
import cijeneService from "@/lib/cijene-api";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import type { ISidebarFilterOption } from "@/components/custom/sidebar-filter-menu";

function byLabel(a: ISidebarFilterOption, b: ISidebarFilterOption): number {
  return compareHr(a.label, b.label);
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
          label: getChainLabel(chain.chain_code),
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
