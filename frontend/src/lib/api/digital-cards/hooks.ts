import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import {
  patchCards,
  restoreCards,
  updateCard,
  upsertCard,
  zonelessNow,
  type ICardsRollback,
} from "@/lib/api/digital-cards/optimistic-cards";
import {
  deleteDigitalCard,
  getDigitalCardsConfig,
  getMyDigitalCards,
  saveDigitalCard,
  setDigitalCardArchived,
  setDigitalCardPinned,
} from "@/lib/api/digital-cards/queries";
import type {
  DigitalCardDto,
  DigitalCardRequest,
  DigitalCardsConfig,
} from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { deleteForCard, pruneToCards } from "@/lib/offline/card-photo-store";
import {
  cardDeleteFailed,
  cardWriteFailed,
} from "@/lib/offline/card-write-failed";
import {
  DIGITAL_CARD_MUTATION_SCOPE,
  OFFLINE_MUTATION_KEYS,
} from "@/lib/offline/offline-mutation-keys";
import { requestPersistentStorage } from "@/lib/offline/request-persistent-storage";

async function fetchCardsAndPrunePhotos(): Promise<DigitalCardDto[]> {
  const cards = await getMyDigitalCards();

  // Cached photo blobs of cards that no longer exist are personal data left behind.
  void pruneToCards(getCacheIdentity(), cards).catch(() => undefined);

  return cards;
}

export function useGetMyDigitalCards({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<DigitalCardDto[], Error>({
    queryKey: DIGITAL_CARD_QUERY_KEYS.me,
    queryFn: fetchCardsAndPrunePhotos,
    enabled,
  });
}

export function useDigitalCardsConfig({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<DigitalCardsConfig, Error>({
    queryKey: DIGITAL_CARD_QUERY_KEYS.config,
    queryFn: getDigitalCardsConfig,
    enabled,
    staleTime: 5 * 60_000,
  });
}

function useInvalidateCards() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.me });
}

export function useSaveDigitalCard() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCards();

  return useMutation<
    DigitalCardDto,
    Error,
    { id: string; data: DigitalCardRequest },
    ICardsRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardSave,
    scope: DIGITAL_CARD_MUTATION_SCOPE,
    mutationFn: ({ id, data }) => saveDigitalCard(id, data),
    onMutate: ({ id, data }) =>
      patchCards(queryClient, id, (cards) => upsertCard(cards, id, data)),
    onError: (error, _variables, rollback) => {
      restoreCards(queryClient, rollback);
      cardWriteFailed(error);
    },
    onSuccess: requestPersistentStorage,
    onSettled: invalidate,
  });
}

export function useDeleteDigitalCard() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCards();

  return useMutation<void, Error, string, ICardsRollback | undefined>({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardDelete,
    scope: DIGITAL_CARD_MUTATION_SCOPE,
    mutationFn: deleteDigitalCard,
    onMutate: (id) =>
      patchCards(queryClient, id, (cards) => cards.filter((c) => c.id !== id)),
    onError: (error, _id, rollback) => {
      restoreCards(queryClient, rollback);
      cardDeleteFailed(error);
    },
    onSuccess: (_data, id) =>
      deleteForCard(getCacheIdentity(), id).catch(() => undefined),
    onSettled: invalidate,
  });
}

export function usePinDigitalCard() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCards();

  return useMutation<
    void,
    Error,
    { id: string; pinned: boolean },
    ICardsRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardPin,
    scope: DIGITAL_CARD_MUTATION_SCOPE,
    mutationFn: ({ id, pinned }) => setDigitalCardPinned(id, pinned),
    onMutate: ({ id, pinned }) =>
      patchCards(queryClient, id, (cards) =>
        updateCard(cards, id, { pinnedAt: pinned ? zonelessNow() : null }),
      ),
    onError: (error, _variables, rollback) => {
      restoreCards(queryClient, rollback);
      cardWriteFailed(error);
    },
    onSettled: invalidate,
  });
}

export function useArchiveDigitalCard() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCards();

  return useMutation<
    void,
    Error,
    { id: string; archived: boolean },
    ICardsRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardArchive,
    scope: DIGITAL_CARD_MUTATION_SCOPE,
    mutationFn: ({ id, archived }) => setDigitalCardArchived(id, archived),
    onMutate: ({ id, archived }) =>
      patchCards(queryClient, id, (cards) =>
        updateCard(cards, id, { archivedAt: archived ? zonelessNow() : null }),
      ),
    onError: (error, _variables, rollback) => {
      restoreCards(queryClient, rollback);
      cardWriteFailed(error);
    },
    onSettled: invalidate,
  });
}
