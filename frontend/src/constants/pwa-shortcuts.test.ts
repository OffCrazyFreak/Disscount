import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { pwaShortcuts, shortcutNavIds } from "@/constants/pwa-shortcuts";

const PUBLIC_DIR = path.resolve(__dirname, "../../public");

describe("pwaShortcuts", () => {
  it("puts scan, lists and cards in the three slots Android shows", () => {
    expect(pwaShortcuts.slice(0, 3).map((shortcut) => shortcut.url)).toEqual([
      "/?scan=1",
      "/shopping-lists",
      "/digital-cards",
    ]);
  });

  it("follows the owner's order for the rest", () => {
    expect(shortcutNavIds).toEqual([
      "shopping-lists",
      "digital-cards",
      "watchlist",
      "map",
      "spending",
    ]);
  });

  // Covers the gated ones too, so releasing a feature can never ship a broken icon.
  it("has both icon tiles on disk for every shortcut it can emit", () => {
    for (const id of ["scan", ...shortcutNavIds]) {
      for (const file of [`${id}.png`, `${id}-any.png`]) {
        expect(
          existsSync(path.join(PUBLIC_DIR, "brand/shortcuts", file)),
          file,
        ).toBe(true);
      }
    }
  });

  it("points every emitted icon at a real file", () => {
    for (const icon of pwaShortcuts.flatMap(
      (shortcut) => shortcut.icons ?? [],
    )) {
      expect(existsSync(path.join(PUBLIC_DIR, icon.src)), icon.src).toBe(true);
    }
  });
});
