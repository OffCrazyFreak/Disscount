import type { QueryClient } from "@tanstack/react-query";

import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import type { DigitalCardDto, DigitalCardRequest } from "@/lib/api/types";

type CardList = DigitalCardDto[] | undefined;

/** Zone-less UTC, the same shape the server writes, so parseServerDate reads it back. */
export function zonelessNow(): string {
  return new Date().toISOString().replace("Z", "");
}

/** Only the card an optimistic write touched, so a rollback cannot undo other cards. */
export interface ICardsRollback {
  cardId: string;
  previous: DigitalCardDto | undefined;
  index: number;
}

/** Cancels in-flight reads first so a late GET cannot overwrite the optimistic write. */
export async function patchCards(
  queryClient: QueryClient,
  cardId: string,
  update: (cards: DigitalCardDto[]) => DigitalCardDto[],
): Promise<ICardsRollback> {
  await queryClient.cancelQueries({ queryKey: DIGITAL_CARD_QUERY_KEYS.me });

  const cards =
    queryClient.getQueryData<DigitalCardDto[]>(DIGITAL_CARD_QUERY_KEYS.me) ??
    [];
  const index = cards.findIndex((card) => card.id === cardId);
  const rollback: ICardsRollback = {
    cardId,
    previous: cards[index],
    index,
  };

  queryClient.setQueryData<CardList>(DIGITAL_CARD_QUERY_KEYS.me, (old) =>
    update(old ?? []),
  );

  return rollback;
}

/** Puts one card back (or removes it if it did not exist) and leaves the rest alone. */
export function restoreCardIn(
  cards: DigitalCardDto[],
  { cardId, previous, index }: ICardsRollback,
): DigitalCardDto[] {
  if (!previous) return cards.filter((card) => card.id !== cardId);

  if (cards.some((card) => card.id === cardId)) {
    return cards.map((card) => (card.id === cardId ? previous : card));
  }

  const at = Math.min(Math.max(index, 0), cards.length);
  return [...cards.slice(0, at), previous, ...cards.slice(at)];
}

export function restoreCards(
  queryClient: QueryClient,
  rollback: ICardsRollback | undefined,
) {
  if (!rollback) return;

  queryClient.setQueryData<CardList>(
    DIGITAL_CARD_QUERY_KEYS.me,
    (old) => old && restoreCardIn(old, rollback),
  );
}

function cardFromRequest(
  id: string,
  data: DigitalCardRequest,
  existing: DigitalCardDto | undefined,
): DigitalCardDto {
  const now = zonelessNow();

  return {
    pinnedAt: null,
    lastUsedAt: null,
    archivedAt: null,
    photos: [],
    ...existing,
    id,
    cardName: data.cardName,
    cardType: data.cardType,
    storeName: data.storeName,
    chainCode: data.chainCode ?? null,
    codeValue: data.codeValue,
    barcodeValue: data.barcodeValue ?? null,
    codeType: data.codeType,
    cardColor: data.cardColor,
    note: data.note ?? null,
    validFrom: data.validFrom ?? null,
    expiresOn: data.expiresOn ?? null,
    balance: data.balance ?? null,
    balanceUnit: data.balanceUnit ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function upsertCard(
  cards: DigitalCardDto[],
  id: string,
  data: DigitalCardRequest,
): DigitalCardDto[] {
  const existing = cards.find((card) => card.id === id);
  const next = cardFromRequest(id, data, existing);

  return existing
    ? cards.map((card) => (card.id === id ? next : card))
    : [next, ...cards];
}

export function updateCard(
  cards: DigitalCardDto[],
  id: string,
  patch: Partial<DigitalCardDto>,
): DigitalCardDto[] {
  return cards.map((card) => (card.id === id ? { ...card, ...patch } : card));
}
