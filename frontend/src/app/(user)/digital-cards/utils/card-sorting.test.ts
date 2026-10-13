import { describe, expect, it } from "vitest";

import type { DigitalCardDto } from "@/lib/api/types";
import {
  filterCards,
  sortCards,
} from "@/app/(user)/digital-cards/utils/card-sorting";

function card(id: string, overrides: Partial<DigitalCardDto> = {}) {
  return {
    id,
    cardName: id,
    cardType: "loyalty",
    storeName: "Konzum",
    chainCode: null,
    codeValue: "1234567890123",
    barcodeValue: null,
    codeType: "ean_13",
    cardColor: "#616161",
    note: null,
    validFrom: null,
    expiresOn: null,
    balance: null,
    balanceUnit: null,
    pinnedAt: null,
    lastUsedAt: null,
    archivedAt: null,
    createdAt: "2026-01-01T10:00:00",
    updatedAt: "2026-01-01T10:00:00",
    photos: [],
    ...overrides,
  } satisfies DigitalCardDto;
}

function ids(cards: DigitalCardDto[]) {
  return cards.map((c) => c.id);
}

describe("sortCards", () => {
  it("orders by last use, then by update time", () => {
    const cards = [
      card("never-old", { updatedAt: "2026-01-02T10:00:00" }),
      card("never-new", { updatedAt: "2026-03-02T10:00:00" }),
      card("used-old", { lastUsedAt: "2026-02-01T10:00:00" }),
      card("used-new", { lastUsedAt: "2026-02-05T10:00:00" }),
    ];

    expect(ids(sortCards(cards, "recent-use"))).toEqual([
      "used-new",
      "used-old",
      "never-new",
      "never-old",
    ]);
  });

  it("orders names with Croatian collation", () => {
    const cards = [
      card("z", { cardName: "Zeleno" }),
      card("c-hacek", { cardName: "Čaj" }),
      card("d", { cardName: "Dm" }),
      card("c", { cardName: "Cvijet" }),
    ];

    expect(ids(sortCards(cards, "name"))).toEqual(["c", "c-hacek", "d", "z"]);
  });

  it("orders by store, then card name", () => {
    const cards = [
      card("b", { storeName: "Spar", cardName: "B" }),
      card("a2", { storeName: "Konzum", cardName: "B" }),
      card("a1", { storeName: "Konzum", cardName: "A" }),
    ];

    expect(ids(sortCards(cards, "store"))).toEqual(["a1", "a2", "b"]);
  });

  it("orders by type in the order of the type list", () => {
    const cards = [
      card("other", { cardType: "other" }),
      card("gift", { cardType: "gift" }),
      card("loyalty", { cardType: "loyalty" }),
      card("member", { cardType: "membership" }),
    ];

    expect(ids(sortCards(cards, "type"))).toEqual([
      "loyalty",
      "gift",
      "member",
      "other",
    ]);
  });

  it("orders by edit time and creation time, newest first", () => {
    const cards = [
      card("a", {
        updatedAt: "2026-02-01T10:00:00",
        createdAt: "2026-01-03T10:00:00",
      }),
      card("b", {
        updatedAt: "2026-03-01T10:00:00",
        createdAt: "2026-01-01T10:00:00",
      }),
    ];

    expect(ids(sortCards(cards, "edited"))).toEqual(["b", "a"]);
    expect(ids(sortCards(cards, "added"))).toEqual(["a", "b"]);
  });

  it("orders by palette position, unknown colours last", () => {
    const cards = [
      card("custom", { cardColor: "#123456" }),
      card("grape", { cardColor: "#8E24AA" }),
      card("graphite", { cardColor: "#616161" }),
      card("tomato", { cardColor: "#d50000" }),
    ];

    expect(ids(sortCards(cards, "color"))).toEqual([
      "graphite",
      "tomato",
      "grape",
      "custom",
    ]);
  });

  it("keeps pinned cards first in every mode", () => {
    const cards = [
      card("a", { cardName: "A" }),
      card("z", { cardName: "Z", pinnedAt: "2026-01-01T10:00:00" }),
    ];

    expect(ids(sortCards(cards, "name"))).toEqual(["z", "a"]);
    expect(ids(sortCards(cards, "recent-use"))[0]).toBe("z");
  });

  it("does not mutate its input", () => {
    const cards = [card("b", { cardName: "B" }), card("a", { cardName: "A" })];

    sortCards(cards, "name");

    expect(ids(cards)).toEqual(["b", "a"]);
  });
});

describe("filterCards", () => {
  const cards = [
    card("milk", { cardName: "Moja kartica", storeName: "Konzum" }),
    card("note", { cardName: "Druga", storeName: "Spar", note: "Za Čakovec" }),
    card("code", {
      cardName: "Treća",
      storeName: "Tommy",
      codeValue: "9990001112223",
    }),
  ];

  it("matches name, store and note, ignoring diacritics", () => {
    expect(ids(filterCards(cards, "konzum"))).toEqual(["milk"]);
    expect(ids(filterCards(cards, "cakovec"))).toEqual(["note"]);
    expect(ids(filterCards(cards, "moja"))).toEqual(["milk"]);
  });

  it("never matches the code value", () => {
    expect(filterCards(cards, "9990001112223")).toEqual([]);
  });

  it("returns every card for an empty query, in the given order", () => {
    expect(ids(filterCards(cards, ""))).toEqual(["milk", "note", "code"]);
  });
});
