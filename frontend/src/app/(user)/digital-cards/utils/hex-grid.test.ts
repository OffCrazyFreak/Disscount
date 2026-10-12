import { describe, expect, it } from "vitest";

import { CARD_PALETTE } from "./card-palette";
import { hexCell, nextCellIndex } from "./hex-grid";

const cells = CARD_PALETTE.map((color) => hexCell(color.ring, color.angle));
const indexOf = (name: string) =>
  CARD_PALETTE.findIndex((color) => color.name === name);
const move = (from: string, key: string) =>
  CARD_PALETTE[nextCellIndex(cells, indexOf(from), key)].name;

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
    expect(move("Grožđe", "ArrowRight")).toBe("Radič");
    expect(move("Grafit", "ArrowLeft")).toBe("Lavanda");
    expect(move("Grožđe", "ArrowLeft")).toBe("Bosiljak");
    expect(move("Bosiljak", "ArrowRight")).toBe("Grožđe");
  });

  it("jumps to the first and last cell", () => {
    expect(move("Grafit", "Home")).toBe("Grožđe");
    expect(move("Grafit", "End")).toBe("Bosiljak");
  });

  it("goes to the nearest cell by x, preferring the left one on a tie", () => {
    expect(move("Grafit", "ArrowUp")).toBe("Trešnjin cvijet");
    expect(move("Grafit", "ArrowDown")).toBe("Paun");
    expect(move("Mango", "ArrowUp")).toBe("Flamingo");
  });

  it("wraps vertically to the opposite edge row", () => {
    expect(move("Radič", "ArrowUp")).toBe("Kadulja");
    expect(move("Kadulja", "ArrowDown")).toBe("Radič");
  });

  it("ignores other keys", () => {
    expect(move("Grafit", "a")).toBe("Grafit");
  });
});
