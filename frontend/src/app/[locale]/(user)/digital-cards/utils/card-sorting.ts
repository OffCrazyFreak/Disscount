import { CARD_TYPES } from "@/constants/card-codes";
import type { DigitalCardDto } from "@/lib/api/types";
import { parseServerDate } from "@/utils/date";
import { rankByFields } from "@/utils/generic";
import { compareHr } from "@/utils/strings";
import { CARD_PALETTE } from "@/app/[locale]/(user)/digital-cards/utils/card-palette";

export const CARD_SORT_MODES = [
  "recent-use",
  "name",
  "store",
  "type",
  "edited",
  "added",
  "color",
] as const;

export type CardSortMode = (typeof CARD_SORT_MODES)[number];

export const DEFAULT_CARD_SORT: CardSortMode = "recent-use";

export const CARD_SORT_LABELS: Record<CardSortMode, string> = {
  "recent-use": "Nedavno korišteno",
  name: "Naziv",
  store: "Trgovina",
  type: "Tip",
  edited: "Nedavno uređeno",
  added: "Nedavno dodano",
  color: "Boja",
};

export function isCardSortMode(value: unknown): value is CardSortMode {
  return CARD_SORT_MODES.some((mode) => mode === value);
}

function time(value: string | null): number {
  return value ? parseServerDate(value).getTime() : Number.NEGATIVE_INFINITY;
}

// Newest first; a missing timestamp sorts last without producing NaN from -Infinity.
function newestFirst(a: string | null, b: string | null): number {
  const left = time(a);
  const right = time(b);

  if (left === right) return 0;

  return left < right ? 1 : -1;
}

function paletteIndex(hex: string): number {
  const index = CARD_PALETTE.findIndex(
    (color) => color.hex.toLowerCase() === hex.toLowerCase(),
  );

  return index === -1 ? CARD_PALETTE.length : index;
}

const COMPARATORS: Record<
  CardSortMode,
  (a: DigitalCardDto, b: DigitalCardDto) => number
> = {
  "recent-use": (a, b) =>
    newestFirst(a.lastUsedAt, b.lastUsedAt) ||
    newestFirst(a.updatedAt, b.updatedAt),
  name: (a, b) => compareHr(a.cardName, b.cardName),
  store: (a, b) =>
    compareHr(a.storeName, b.storeName) || compareHr(a.cardName, b.cardName),
  type: (a, b) =>
    CARD_TYPES.indexOf(a.cardType) - CARD_TYPES.indexOf(b.cardType) ||
    compareHr(a.cardName, b.cardName),
  edited: (a, b) => newestFirst(a.updatedAt, b.updatedAt),
  added: (a, b) => newestFirst(a.createdAt, b.createdAt),
  color: (a, b) =>
    paletteIndex(a.cardColor) - paletteIndex(b.cardColor) ||
    compareHr(a.cardName, b.cardName),
};

/** Pinned cards lead in every mode; the chosen mode orders within each half. */
export function sortCards(
  cards: readonly DigitalCardDto[],
  mode: CardSortMode,
): DigitalCardDto[] {
  return [...cards].sort(
    (a, b) =>
      Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt)) ||
      COMPARATORS[mode](a, b),
  );
}

/** Name, store and note only. The code is never searched, so it cannot leak into a URL. */
export function filterCards(
  cards: readonly DigitalCardDto[],
  query: string,
): DigitalCardDto[] {
  return rankByFields([...cards], query, ["cardName", "storeName", "note"]).map(
    (ranked) => ranked.item,
  );
}
