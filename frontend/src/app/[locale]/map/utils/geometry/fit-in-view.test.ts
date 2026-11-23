import { describe, expect, it } from "vitest";

import {
  IBox,
  cameraPanToFit,
  visibleBox,
} from "@/app/[locale]/map/utils/geometry/fit-in-view";

function box(left: number, top: number, right: number, bottom: number): IBox {
  return { left, top, right, bottom };
}

describe("visibleBox", () => {
  it("leaves out the header, the panel and the sheet, plus a margin", () => {
    expect(visibleBox(1000, 800, { top: 80, bottom: 300, right: 400 })).toEqual(
      box(12, 92, 588, 488),
    );
  });
});

describe("cameraPanToFit", () => {
  const area = box(12, 92, 588, 488);

  it("leaves a pin and card that already fit alone", () => {
    expect(
      cameraPanToFit(box(100, 200, 140, 240), box(80, 268, 400, 450), area),
    ).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("lifts a pin out from under the phone's sheet", () => {
    expect(cameraPanToFit(box(170, 600, 210, 640), null, area)).toEqual({
      x: 0,
      y: 152,
    });
  });

  it("brings a card that runs off the bottom fully into view", () => {
    expect(
      cameraPanToFit(box(300, 300, 340, 340), box(200, 368, 500, 520), area),
    ).toEqual({
      x: 0,
      y: 32,
    });
  });

  it("moves the card left of the desktop panel", () => {
    expect(
      cameraPanToFit(box(500, 200, 540, 240), box(400, 268, 700, 400), area),
    ).toEqual({
      x: 112,
      y: 0,
    });
  });

  it("keeps the card whole when the card and pin together are too tall", () => {
    expect(
      cameraPanToFit(box(300, 100, 340, 140), box(200, 168, 500, 560), area),
    ).toEqual({
      x: 0,
      y: 72,
    });
  });

  it("starts a card taller than the area at the area's top", () => {
    expect(
      cameraPanToFit(box(300, 100, 340, 140), box(200, 168, 500, 600), area),
    ).toEqual({
      x: 0,
      y: 76,
    });
  });

  it("pulls a pin hidden under the header down into view", () => {
    expect(cameraPanToFit(box(300, 20, 340, 60), null, area)).toEqual({
      x: 0,
      y: -72,
    });
  });
});
