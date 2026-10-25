import { describe, expect, it } from "vitest";

import { rankedChain } from "@/app/[locale]/map/utils/cluster-stack";

describe("rankedChain", () => {
  it("binds no variables, which MapLibre would re-evaluate at every use", () => {
    const expression = JSON.stringify(
      rankedChain(["konzum", "lidl", "spar"], 2),
    );

    expect(expression).not.toContain('"let"');
    expect(expression).not.toContain('"var"');
  });

  it("names every chain once per rank, with ties broken by list order", () => {
    const expression = rankedChain(["konzum", "lidl"], 0);

    expect(expression).toEqual([
      "case",
      [
        "all",
        [">", ["get", "count:konzum"], 0],
        [
          "==",
          [
            "+",
            0,
            [
              "case",
              [">", ["get", "count:lidl"], ["get", "count:konzum"]],
              1,
              0,
            ],
          ],
          0,
        ],
      ],
      "konzum",
      [
        "all",
        [">", ["get", "count:lidl"], 0],
        [
          "==",
          [
            "+",
            0,
            [
              "case",
              [">=", ["get", "count:konzum"], ["get", "count:lidl"]],
              1,
              0,
            ],
          ],
          0,
        ],
      ],
      "lidl",
      "",
    ]);
  });
});
