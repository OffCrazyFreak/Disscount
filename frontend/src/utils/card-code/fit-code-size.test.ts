import { describe, expect, it } from "vitest";

import { fitCodeSize } from "@/utils/card-code/fit-code-size";

describe("fitCodeSize", () => {
  it("uses whole device pixels per module", () => {
    const size = fitCodeSize({
      modulesWide: 100,
      modulesHigh: 20,
      maxWidth: 350,
      maxHeight: null,
      dpr: 2,
    });

    expect(size).toEqual({ width: 350, height: 70 });
  });

  it("lets the height limit win for a matrix code", () => {
    const size = fitCodeSize({
      modulesWide: 40,
      modulesHigh: 40,
      maxWidth: 300,
      maxHeight: 80,
      dpr: 1,
    });

    expect(size).toEqual({ width: 80, height: 80 });
  });

  it("returns null when one device pixel per module does not fit", () => {
    expect(
      fitCodeSize({
        modulesWide: 400,
        modulesHigh: 40,
        maxWidth: 300,
        maxHeight: null,
        dpr: 1,
      }),
    ).toBeNull();
  });
});
