import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

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
  saveDigitalCard,
  setDigitalCardArchived,
  setDigitalCardPinned,
} from "@/lib/api/digital-cards/queries";
import type { DigitalCardDto, DigitalCardRequest } from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { deleteForCard } from "@/lib/offline/card-photo-store";
import { CARD_WRITE_RETRY } from "@/lib/offline/card-retry";
import {
  cardDeleteFailed,
  cardWriteFailed,
} from "@/lib/offline/card-write-failed";
import {
  DIGITAL_CARD_MUTATION_SCOPE,
  OFFLINE_MUTATION_KEYS,
} from "@/lib/offline/offline-mutation-keys";
import { requestPersistentStorage } from "@/lib/offline/request-persistent-storage";

function useInvalidateCards() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.me });
}

/** Queueing, retry, rollback, error toast and refetch shared by card save, pin and archive. */
function useCardWriteOptions() {
  const tCards = useTranslations("digitalCards");
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCards();

  return {
    scope: DIGITAL_CARD_MUTATION_SCOPE,
    ...CARD_WRITE_RETRY,
    onError: (
      error: Error,
      _variables: unknown,
      rollback: ICardsRollback | undefined,
    ) => {
      restoreCards(queryClient, rollback);
      cardWriteFailed(error, tCards);
    },
    onSettled: invalidate,
  };
}

export function useSaveDigitalCard() {
  const queryClient = useQueryClient();
  const writeOptions = useCardWriteOptions();

  return useMutation<
    DigitalCardDto,
    Error,
    { id: string; data: DigitalCardRequest },
    ICardsRollback | undefined
  >({
    ...writeOptions,
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardSave,
    mutationFn: ({ id, data }) => saveDigitalCard(id, data),
    onMutate: ({ id, data }) =>
      patchCards(queryClient, id, (cards) => upsertCard(cards, id, data)),
    onSuccess: requestPersistentStorage,
  });
}

export function useDeleteDigitalCard() {
  const tCards = useTranslations("digitalCards");
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCards();

  return useMutation<void, Error, string, ICardsRollback | undefined>({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardDelete,
    scope: DIGITAL_CARD_MUTATION_SCOPE,
    ...CARD_WRITE_RETRY,
    mutationFn: deleteDigitalCard,
    onMutate: (id) =>
      patchCards(queryClient, id, (cards) => cards.filter((c) => c.id !== id)),
    onError: (error, _id, rollback) => {
      restoreCards(queryClient, rollback);
      cardDeleteFailed(error, tCards);
    },
    onSuccess: (_data, id) =>
      deleteForCard(getCacheIdentity(), id).catch(() => undefined),
    onSettled: invalidate,
  });
}

export function usePinDigitalCard() {
  const queryClient = useQueryClient();
  const writeOptions = useCardWriteOptions();

  return useMutation<
    void,
    Error,
    { id: string; pinned: boolean },
    ICardsRollback | undefined
  >({
    ...writeOptions,
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardPin,
    mutationFn: ({ id, pinned }) => setDigitalCardPinned(id, pinned),
    onMutate: ({ id, pinned }) =>
      patchCards(queryClient, id, (cards) =>
        updateCard(cards, id, { pinnedAt: pinned ? zonelessNow() : null }),
      ),
  });
}

export function useArchiveDigitalCard() {
  const queryClient = useQueryClient();
  const writeOptions = useCardWriteOptions();

  return useMutation<
    void,
    Error,
    { id: string; archived: boolean },
    ICardsRollback | undefined
  >({
    ...writeOptions,
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardArchive,
    mutationFn: ({ id, archived }) => setDigitalCardArchived(id, archived),
    onMutate: ({ id, archived }) =>
      patchCards(queryClient, id, (cards) =>
        updateCard(cards, id, { archivedAt: archived ? zonelessNow() : null }),
      ),
  });
}
