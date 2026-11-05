import type { QueryClient } from "@tanstack/react-query";

import type { CardPhotoSlot } from "@/constants/card-codes";
import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import type { CardPhotoDto, DigitalCardDto } from "@/lib/api/types";

/** Puts a slot's photo into the cached card, or removes it when `photo` is null. */
export function setCardPhotoInCache(
  queryClient: QueryClient,
  cardId: string,
  slot: CardPhotoSlot,
  photo: CardPhotoDto | null,
) {
  queryClient.setQueryData<DigitalCardDto[] | undefined>(
    DIGITAL_CARD_QUERY_KEYS.me,
    (old) =>
      old?.map((card) =>
        card.id === cardId
          ? {
              ...card,
              photos: [
                ...card.photos.filter((p) => p.slot !== slot),
                ...(photo ? [photo] : []),
              ],
            }
          : card,
      ),
  );
}
