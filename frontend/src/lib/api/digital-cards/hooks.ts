import { queryOptions, useQuery } from "@tanstack/react-query";

import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import {
  getDigitalCardsConfig,
  getMyDigitalCards,
} from "@/lib/api/digital-cards/queries";
import type { DigitalCardDto } from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { pruneToCards } from "@/lib/offline/card-photo-store";

async function fetchCardsAndPrunePhotos(): Promise<DigitalCardDto[]> {
  const cards = await getMyDigitalCards();

  // Cached photo blobs of cards that no longer exist are personal data left behind.
  void pruneToCards(getCacheIdentity(), cards).catch(() => undefined);

  return cards;
}

function myDigitalCardsQueryOptions() {
  return queryOptions({
    queryKey: DIGITAL_CARD_QUERY_KEYS.me,
    queryFn: fetchCardsAndPrunePhotos,
  });
}

function digitalCardsConfigQueryOptions() {
  return queryOptions({
    queryKey: DIGITAL_CARD_QUERY_KEYS.config,
    queryFn: getDigitalCardsConfig,
    staleTime: 5 * 60_000,
  });
}

export function useGetMyDigitalCards({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({ ...myDigitalCardsQueryOptions(), enabled });
}

export function useDigitalCardsConfig({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({ ...digitalCardsConfigQueryOptions(), enabled });
}
