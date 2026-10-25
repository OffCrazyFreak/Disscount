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

function countOf(
  chain: string,
  ranked: ExpressionSpecification[],
): ExpressionSpecification {
  const count: ExpressionSpecification = ["get", chainCountProperty(chain)];
  if (ranked.length === 0) return count;

  return expression([
    "case",
    ["any", ...ranked.map((name) => ["==", name, chain])],
    0,
    count,
  ]);
}

function mostCommonChain(
  chains: string[],
  ranked: ExpressionSpecification[],
): ExpressionSpecification {
  const branches = chains.flatMap((chain) => [
    [
      "all",
      [">", ["var", "best"], 0],
      ["==", countOf(chain, ranked), ["var", "best"]],
    ],
    chain,
  ]);

  return expression([
    "let",
    "best",
    ["max", ...chains.map((chain) => countOf(chain, ranked))],
    ["case", ...branches, ""],
  ]);
}

/**
 * The chain at a given rank (0 is the most common) inside a cluster.
 * Expressions cannot sort, so each rank is the highest count once the chains
 * ranked above it are left out. Ties go to the chain listed first.
 */
export function rankedChain(
  chains: string[],
  rank: number,
  ranked: ExpressionSpecification[] = [],
): ExpressionSpecification {
  const depth = ranked.length;
  if (depth === rank) return mostCommonChain(chains, ranked);

  const name = `rank${depth}`;

  return expression([
    "let",
    name,
    mostCommonChain(chains, ranked),
    rankedChain(chains, rank, [...ranked, ["var", name]]),
  ]);
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
