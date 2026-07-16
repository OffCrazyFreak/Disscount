"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/user-context";

/**
 * Prepopulate the chain/location filters from the user's pinned stores and
 * places whenever the URL carries no explicit choice for them. Seeds once
 * per mount so clearing a filter sticks while the user stays on the page.
 */
export default function useSeedPreferredFilters(): void {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (hasSeeded.current || !user) return;

    const pinnedChains = (user.pinnedStores ?? [])
      .map((store) => store.storeApiId)
      .filter(Boolean);
    const pinnedPlaces = (user.pinnedPlaces ?? [])
      .map((place) => place.placeName || place.placeApiId)
      .filter(Boolean);

    if (pinnedChains.length === 0 && pinnedPlaces.length === 0) return;

    hasSeeded.current = true;

    const params = new URLSearchParams(searchParams.toString());
    let seeded = false;

    if (!params.has("chain") && pinnedChains.length > 0) {
      params.set("chain", pinnedChains.join(","));
      seeded = true;
    }

    if (!params.has("location") && pinnedPlaces.length > 0) {
      params.set("location", pinnedPlaces.join(","));
      seeded = true;
    }

    if (!seeded) return;

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [user, searchParams, pathname, router]);
}
