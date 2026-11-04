import type { ExpressionSpecification } from "maplibre-gl";

// The style spec types expressions as fixed tuples, which a per-chain list cannot satisfy; MapLibre validates the result when the layer loads.
function expression(value: unknown): ExpressionSpecification {
  return value as ExpressionSpecification;
}

function chainCountProperty(chain: string): string {
  return `count:${chain}`;
}

export function chainCountProperties(
  chains: string[],
): Record<string, ExpressionSpecification> {
  return Object.fromEntries(
    chains.map((chain) => [
      chainCountProperty(chain),
      ["+", ["case", ["==", ["get", "chain"], chain], 1, 0]],
    ]),
  );
}

function countOf(chain: string): ExpressionSpecification {
  return ["get", chainCountProperty(chain)];
}

// More stores, or as many and listed earlier, so every rank goes to exactly one chain.
function chainsAbove(chains: string[], index: number): ExpressionSpecification {
  const count = countOf(chains[index]);

  return expression([
    "+",
    0,
    ...chains.flatMap((other, otherIndex) =>
      otherIndex === index
        ? []
        : [
            [
              "case",
              [otherIndex < index ? ">=" : ">", countOf(other), count],
              1,
              0,
            ],
          ],
    ),
  ]);
}

/** Expressions cannot sort, so rank counts chains above; no `let`, because MapLibre re-evaluates a bound expression at every `var`, which stalled the worker. */
export function rankedChain(
  chains: string[],
  rank: number,
): ExpressionSpecification {
  const branches = chains.flatMap((chain, index) => [
    ["all", [">", countOf(chain), 0], ["==", chainsAbove(chains, index), rank]],
    chain,
  ]);

  return expression(["case", ...branches, ""]);
}

export function hasChains(
  chains: string[],
  atLeast: number,
): ExpressionSpecification {
  return expression([
    ">=",
    [
      "+",
      ...chains.map((chain) => [
        "case",
        [">", ["get", chainCountProperty(chain)], 0],
        1,
        0,
      ]),
    ],
    atLeast,
  ]);
}
