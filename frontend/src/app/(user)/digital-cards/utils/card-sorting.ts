import type { DigitalCardDto } from "@/lib/api/types";
import { compareHr } from "@/utils/strings";
import { hueFromHex } from "@/app/(user)/digital-cards/utils/card-colors";
import { getCardTypeLabel } from "@/app/(user)/digital-cards/utils/card-labels";

export const CARD_SORT_MODES = [
  "cardName",
  "storeName",
  "cardType",
  "updatedAt",
  "createdAt",
  "cardColor",
] as const;

export type CardSortMode = (typeof CARD_SORT_MODES)[number];

export const DEFAULT_CARD_SORT: CardSortMode = "updatedAt";

export function isCardSortMode(value: unknown): value is CardSortMode {
  return (
    typeof value === "string" &&
    (CARD_SORT_MODES as readonly string[]).includes(value)
  );
}

export const CARD_SORT_LABELS: Record<CardSortMode, string> = {
  cardName: "Naziv kartice",
  storeName: "Trgovina",
  cardType: "Tip kartice",
  updatedAt: "Nedavno uređeno",
  createdAt: "Nedavno dodano",
  cardColor: "Boja",
};

/**
 * Compared as strings, not parsed dates. The server sends ISO-8601, which already sorts
 * chronologically byte by byte, so this cannot produce the NaN that date arithmetic can
 * when a timestamp is malformed.
 */
function byNewestFirst(a: string, b: string): number {
  return b.localeCompare(a);
}

/** Greys have no hue, so they collect at the end instead of landing on red. */
function compareColor(a: string, b: string): number {
  const left = hueFromHex(a);
  const right = hueFromHex(b);

  if (left.isNeutral !== right.isNeutral) return left.isNeutral ? 1 : -1;
  if (left.isNeutral && right.isNeutral) return a.localeCompare(b);
  if (left.hue !== right.hue) return left.hue - right.hue;

  // Same hue, different shade: keep identical colours adjacent.
  return a.localeCompare(b);
}

function compareBy(mode: CardSortMode) {
  return (a: DigitalCardDto, b: DigitalCardDto): number => {
    switch (mode) {
      case "cardName":
        return compareHr(a.cardName, b.cardName);
      case "storeName":
        return compareHr(a.storeName, b.storeName);
      case "cardType":
        return compareHr(
          getCardTypeLabel(a.cardType),
          getCardTypeLabel(b.cardType),
        );
      case "updatedAt":
        return byNewestFirst(a.updatedAt, b.updatedAt);
      case "createdAt":
        return byNewestFirst(a.createdAt, b.createdAt);
      case "cardColor":
        return compareColor(a.cardColor, b.cardColor);
    }
  };
}

export interface ISortedCardGroups {
  pinned: DigitalCardDto[];
  rest: DigitalCardDto[];
}

/**
 * Pinned cards keep their own group at the top, but they are sorted by the same mode as
 * the rest, so the chosen order still means something inside it.
 */
export function groupAndSortCards(
  cards: DigitalCardDto[],
  mode: CardSortMode,
): ISortedCardGroups {
  const compare = compareBy(mode);
  const withTieBreak = (a: DigitalCardDto, b: DigitalCardDto) =>
    compare(a, b) || compareHr(a.cardName, b.cardName);

  return {
    pinned: cards.filter((card) => card.pinnedAt).sort(withTieBreak),
    rest: cards.filter((card) => !card.pinnedAt).sort(withTieBreak),
  };
}
