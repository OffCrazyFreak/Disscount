import type { ExpressionSpecification } from "maplibre-gl";

// The style spec types expressions as fixed tuples, which a list built per
// chain cannot satisfy; MapLibre validates the result when the layer loads.
function expression(value: unknown): ExpressionSpecification {
  return value as ExpressionSpecification;
}

function chainCountProperty(chain: string): string {
  return `count:${chain}`;
}

/** Per-chain store counts every cluster carries, summed as stores merge. */
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

// How many chains rank above this one: more stores, or as many and listed
// earlier, so every rank goes to exactly one chain.
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

/**
 * The chain at a given rank (0 is the most common) inside a cluster, or an
 * empty string past the last chain present. Expressions cannot sort, so a
 * chain's rank is the number of chains above it. No `let` bindings: MapLibre
 * re-evaluates a bound expression at every `var`, which made a nested ranking
 * explode on clusters mixing many chains and stalled the map worker.
 */
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

/** True for a cluster holding stores of at least this many chains. */
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
