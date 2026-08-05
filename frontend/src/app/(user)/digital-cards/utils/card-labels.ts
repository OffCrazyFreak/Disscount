import type { CardType } from "@/constants/card-codes";

const CARD_TYPE_LABELS: Record<CardType, string> = {
  loyalty: "Kartica vjernosti",
  gift: "Poklon kartica",
  membership: "Članska kartica",
  other: "Ostalo",
};

/**
 * Takes the DTO's plain string rather than the union: the value comes off the wire, so a
 * backend that gains a type before the frontend does would otherwise render "undefined".
 */
export function getCardTypeLabel(cardType: string): string {
  return CARD_TYPE_LABELS[cardType as CardType] ?? CARD_TYPE_LABELS.other;
}

export function getCardTypeOptions(): { value: CardType; label: string }[] {
  return (Object.keys(CARD_TYPE_LABELS) as CardType[]).map((value) => ({
    value,
    label: CARD_TYPE_LABELS[value],
  }));
}

/** Up to two letters, so a card with no icon and no chain logo still reads as itself. */
export function getStoreInitials(storeName: string): string {
  const words = storeName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const initials =
    words.length === 1 ? words[0].slice(0, 2) : `${words[0][0]}${words[1][0]}`;

  return initials.toUpperCase();
}
