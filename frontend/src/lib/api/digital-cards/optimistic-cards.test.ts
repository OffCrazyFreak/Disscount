import { describe, expect, it } from "vitest";

import { restoreCardIn } from "@/lib/api/digital-cards/optimistic-cards";
import type { DigitalCardDto } from "@/lib/api/types";

function card(id: string, cardName = id): DigitalCardDto {
  return { id, cardName } as DigitalCardDto;
}

describe("restoreCardIn", () => {
  it("restores only the affected card and keeps later edits to others", () => {
    const current = [
      card("a", "a edited meanwhile"),
      card("b", "b optimistic"),
    ];

    const result = restoreCardIn(current, {
      cardId: "b",
      previous: card("b", "b original"),
      index: 1,
    });

    expect(result.map((c) => c.cardName)).toEqual([
      "a edited meanwhile",
      "b original",
    ]);
  });

  it("removes a card that did not exist before the write", () => {
    const result = restoreCardIn([card("a"), card("new")], {
      cardId: "new",
      previous: undefined,
      index: -1,
    });

    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("reinserts a deleted card at its old position", () => {
    const result = restoreCardIn([card("a"), card("c")], {
      cardId: "b",
      previous: card("b"),
      index: 1,
    });

    expect(result.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});
