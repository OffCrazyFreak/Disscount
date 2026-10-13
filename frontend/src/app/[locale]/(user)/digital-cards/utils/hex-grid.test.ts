import { describe, expect, it } from "vitest";

import { CARD_PALETTE } from "./card-palette";
import { hexCell, nextCellIndex } from "./hex-grid";

const cells = CARD_PALETTE.map((color) => hexCell(color.ring, color.angle));
function indexOf(name: string) {
  return CARD_PALETTE.findIndex((color) => color.id === name);
}
function move(from: string, key: string) {
  return CARD_PALETTE[nextCellIndex(cells, indexOf(from), key)].id;
}

describe("hexCell", () => {
  it("places the 19 cells on distinct spots", () => {
    expect(new Set(cells.map((c) => `${c.q},${c.r}`)).size).toBe(19);
  });

  it("uses a 44 px pitch and 38 px row height", () => {
    expect(hexCell(1, 60)).toMatchObject({ q: 0, r: 1, x: 22, y: 38 });
    expect(hexCell(2, 30)).toMatchObject({ q: 1, r: 1, x: 66, y: 38 });
    expect(hexCell(2, 270)).toMatchObject({ q: 1, r: -2, x: 0, y: -76 });
  });

  it("matches the approved mockup positions", () => {
    expect(hexCell(2, 300)).toMatchObject({ x: 44, y: -76 });
    expect(hexCell(2, 180)).toMatchObject({ x: -88, y: 0 });
  });
});

describe("nextCellIndex", () => {
  it("moves through reading order and wraps", () => {
    expect(move("grape", "ArrowRight")).toBe("radicchio");
    expect(move("graphite", "ArrowLeft")).toBe("lavender");
    expect(move("grape", "ArrowLeft")).toBe("basil");
    expect(move("basil", "ArrowRight")).toBe("grape");
  });

  it("jumps to the first and last cell", () => {
    expect(move("graphite", "Home")).toBe("grape");
    expect(move("graphite", "End")).toBe("basil");
  });

  it("moves Up to the upper-left and Down to the lower-right neighbour", () => {
    expect(move("graphite", "ArrowUp")).toBe("cherryBlossom");
    expect(move("graphite", "ArrowDown")).toBe("avocado");
  });

  it("falls back to the other diagonal when the preferred one is missing", () => {
    expect(move("amethyst", "ArrowUp")).toBe("grape");
    expect(move("pistachio", "ArrowDown")).toBe("basil");
  });

  it("undoes Up with Down and Down with Up from every cell that has both", () => {
    cells.forEach((cell, index) => {
      const up = nextCellIndex(cells, index, "ArrowUp");
      const down = nextCellIndex(cells, index, "ArrowDown");

      if (cells.some((c) => c.q === cell.q && c.r === cell.r - 1)) {
        expect(nextCellIndex(cells, up, "ArrowDown")).toBe(index);
      }
      if (cells.some((c) => c.q === cell.q && c.r === cell.r + 1)) {
        expect(nextCellIndex(cells, down, "ArrowUp")).toBe(index);
      }
    });
  });

  it("wraps vertically to the opposite edge row", () => {
    expect(cells[nextCellIndex(cells, indexOf("radicchio"), "ArrowUp")].r).toBe(
      2,
    );
    expect(cells[nextCellIndex(cells, indexOf("sage"), "ArrowDown")].r).toBe(
      -2,
    );
  });

  it("ignores other keys", () => {
    expect(move("graphite", "a")).toBe("graphite");
  });
});
