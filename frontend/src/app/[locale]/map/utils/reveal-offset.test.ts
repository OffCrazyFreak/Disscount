import { describe, expect, it } from "vitest";

import { revealOffset } from "@/app/[locale]/map/utils/reveal-offset";

// The list shows content from 100 to 500.
const view = { start: 100, end: 500 };

describe("revealOffset", () => {
  it("leaves a row that already fits where it is", () => {
    expect(revealOffset({ start: 200, end: 350 }, view)).toBeNull();
  });

  it("scrolls just enough to show the bottom of an opened row", () => {
    expect(revealOffset({ start: 380, end: 560 }, view)).toBe(160);
  });

  it("keeps the header in view when the row is taller than the list", () => {
    expect(revealOffset({ start: 300, end: 800 }, view)).toBe(300);
  });

  it("scrolls up to a row cut off at the top", () => {
    expect(revealOffset({ start: 60, end: 200 }, view)).toBe(60);
  });
});
