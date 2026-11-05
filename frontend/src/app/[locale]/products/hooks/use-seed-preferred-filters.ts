"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/user-context";
import { FILTER_KEYS } from "@/app/[locale]/products/hooks/use-filter-params";

/** A URL with any filter is deliberate, so it is left alone; seeds once, so a cleared filter sticks. */
export default function useSeedPreferredFilters(enabled = true): void {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { accountUser } = useUser();
  const hasSeeded = useRef(false);

  useEffect(() => {
    // The profile arrives after first render, so this waits for it.
    if (!enabled || hasSeeded.current || !accountUser) return;

    hasSeeded.current = true;

    if (FILTER_KEYS.some((key) => searchParams.has(key))) return;

    const pinnedChains = (accountUser.pinnedStores ?? [])
      .map((store) => store.storeApiId)
      .filter(Boolean);
    const pinnedPlaces = (accountUser.pinnedPlaces ?? [])
      .map((place) => place.placeName)
      .filter(Boolean);

    if (pinnedChains.length === 0 && pinnedPlaces.length === 0) return;

    const params = new URLSearchParams(searchParams.toString());

    pinnedChains.forEach((chain) => params.append("chain", chain));
    pinnedPlaces.forEach((place) => params.append("location", place));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [enabled, accountUser, searchParams, pathname, router]);
}
