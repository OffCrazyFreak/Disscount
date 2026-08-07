import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import {
  cardDeleteFailed,
  cardWriteFailed,
} from "@/lib/offline/card-write-failed";
import { DigitalCardRequest, DigitalCardDto } from "@/lib/api/types";
import {
  createDigitalCard,
  getCurrentUserDigitalCards,
  updateDigitalCard,
  deleteDigitalCard,
  setDigitalCardPinned,
} from "@/lib/api/digital-cards/queries";

export function useCreateDigitalCard() {
  const queryClient = useQueryClient();
  return useMutation<DigitalCardDto, Error, DigitalCardRequest>({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardCreate,
    mutationFn: createDigitalCard,
    onError: cardWriteFailed,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.all }),
  });
}

export function useGetCurrentUserDigitalCards({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<DigitalCardDto[], Error>({
    queryKey: DIGITAL_CARD_QUERY_KEYS.me,
    queryFn: getCurrentUserDigitalCards,
    enabled,
  });
}

export function useUpdateDigitalCard() {
  const queryClient = useQueryClient();
  return useMutation<
    DigitalCardDto,
    Error,
    { id: string; data: DigitalCardRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardUpdate,
    mutationFn: ({ id, data }) => updateDigitalCard(id, data),
    onError: cardWriteFailed,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.all }),
  });
}

export function useDeleteDigitalCard() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardDelete,
    mutationFn: deleteDigitalCard,
    onError: cardDeleteFailed,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.all }),
  });
}

export function useSetDigitalCardPinned() {
  const queryClient = useQueryClient();
  return useMutation<DigitalCardDto, Error, { id: string; pinned: boolean }>({
    mutationKey: OFFLINE_MUTATION_KEYS.digitalCardSetPinned,
    mutationFn: ({ id, pinned }) => setDigitalCardPinned(id, pinned),
    onError: cardWriteFailed,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.all }),
  });
}
