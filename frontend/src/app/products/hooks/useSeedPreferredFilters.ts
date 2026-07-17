"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/user-context";
import { FILTER_KEYS } from "@/app/products/hooks/useFilterParams";

/**
 * Prepopulate the chain and location filters from the user's pinned stores and
 * places, but only for an unfiltered view. A URL that already carries any
 * filter is a deliberate choice, whether shared as a link or picked here, so
 * it is left alone rather than mixed with preferences that could contradict it.
 *
 * Seeds once per mount, so clearing a filter sticks while the user stays.
 */
export default function useSeedPreferredFilters(): void {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const hasSeeded = useRef(false);

  useEffect(() => {
    // The profile arrives after the first render, so this runs once it lands
    // rather than on mount.
    if (hasSeeded.current || !user) return;

    hasSeeded.current = true;

    if (FILTER_KEYS.some((key) => searchParams.has(key))) return;

    const pinnedChains = (user.pinnedStores ?? [])
      .map((store) => store.storeApiId)
      .filter(Boolean);
    const pinnedPlaces = (user.pinnedPlaces ?? [])
      .map((place) => place.placeName || place.placeApiId)
      .filter(Boolean);

    if (pinnedChains.length === 0 && pinnedPlaces.length === 0) return;

    const params = new URLSearchParams(searchParams.toString());

    if (pinnedChains.length > 0) {
      params.set("chain", pinnedChains.join(","));
    }

    if (pinnedPlaces.length > 0) {
      params.set("location", pinnedPlaces.join(","));
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [user, searchParams, pathname, router]);
}
